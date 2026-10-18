-- Base de datos común «Acceso a Microsoft 365» · Paso 3: cada alumno/a una sola vez y para siempre.
-- «alumno» (la lista de Orientación) pasa a tener a TODO el alumnado del colegio, con un id que no cambia
-- de un curso a otro. La columna «seguimiento» marca a quienes sigue Orientación (Orientación solo ve esos).
-- Cada fila de «matriculas» (alumno/a en un grupo en un curso) queda enlazada con su alumno/a (alumno_id).
-- Al cargar un curso nuevo, el enlace se hace solo, por el nombre tal como viene de Séneca.

begin;

alter table alumno add column if not exists seguimiento boolean not null default true;
alter table matriculas add column if not exists alumno_id uuid references alumno (id) on delete set null;
create index if not exists matriculas_alumno_idx on matriculas (alumno_id);

-- Busca (o crea) el alumno/a de una fila de matrícula
create or replace function alumno_de_matricula(p_nombre text, p_clase int) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_curso int := (select curso_id from grupos where id = p_clase);
  v_ids uuid[];
  v_id uuid;
begin
  -- mismo nombre (sin tildes ni mayúsculas) y que no esté ya matriculado/a ese curso en otro grupo
  select array_agg(a.id order by a.seguimiento desc) into v_ids
  from alumno a
  where normalizar_nombre(a.nombre_seneca) = normalizar_nombre(p_nombre)
    and not exists (select 1 from matriculas m join grupos g on g.id = m.clase_id
                    where m.alumno_id = a.id and g.curso_id = v_curso);
  if array_length(v_ids, 1) = 1 then return v_ids[1]; end if;
  if array_length(v_ids, 1) > 1 then
    -- varios con el mismo nombre: solo se enlaza si hay uno en seguimiento
    if (select count(*) from alumno where id = any (v_ids) and seguimiento) = 1 then
      return (select id from alumno where id = any (v_ids) and seguimiento);
    end if;
  end if;
  insert into alumno (nombre, apellidos, nombre_seneca, seguimiento)
  values (coalesce(nullif(trim(substring(p_nombre from position(',' in p_nombre) + 1)), ''), ''),
          trim(split_part(p_nombre, ',', 1)), p_nombre, false)
  returning id into v_id;
  return v_id;
end $$;

create or replace function matriculas_enlazar() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.alumno_id is null then new.alumno_id := alumno_de_matricula(new.nombre, new.clase_id); end if;
  return new;
end $$;
drop trigger if exists matriculas_enlazar on matriculas;
create trigger matriculas_enlazar before insert on matriculas
  for each row execute function matriculas_enlazar();

-- Si Orientación da de alta a alguien que ya estaba en las listas, se fusiona con su ficha del colegio
create or replace function alumno_fusionar() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_viejo uuid;
begin
  if new.seguimiento and new.nombre_seneca is not null then
    for v_viejo in
      select id from alumno
      where id <> new.id and not seguimiento
        and normalizar_nombre(nombre_seneca) = normalizar_nombre(new.nombre_seneca)
    loop
      update matriculas set alumno_id = new.id where alumno_id = v_viejo;
      delete from alumno where id = v_viejo;
    end loop;
  end if;
  return null;
end $$;
drop trigger if exists alumno_fusionar on alumno;
create trigger alumno_fusionar after insert on alumno
  for each row execute function alumno_fusionar();

-- Si Orientación borra a un alumno/a, sigue existiendo en las listas del colegio
create or replace function alumno_reenlazar() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update matriculas set alumno_id = alumno_de_matricula(nombre, clase_id) where alumno_id is null;
  return null;
end $$;
drop trigger if exists alumno_reenlazar on alumno;
create trigger alumno_reenlazar after delete on alumno
  for each statement execute function alumno_reenlazar();

-- Enlazar a todo el alumnado actual (sin llenar el historial de cambios de Orientación)
alter table alumno disable trigger auditoria_alumno;
do $$
declare r record;
begin
  for r in select id, nombre, clase_id from matriculas where alumno_id is null order by id loop
    update matriculas set alumno_id = alumno_de_matricula(r.nombre, r.clase_id) where id = r.id;
  end loop;
end $$;
alter table alumno enable trigger auditoria_alumno;

-- Orientación: el padrón y la sincronización usan ya el enlace (y solo el alumnado en seguimiento)
create or replace view padron with (security_invoker = true) as
select g.id as grupo_id,
       g.curso_academico_id,
       ab.id as banos_alumno_id,
       ab.nombre as nombre_seneca,
       ab.orden,
       al.id as alumno_id
from grupo g
join matriculas ab on ab.clase_id = g.clase_id and ab.activo
left join alumno al on al.id = ab.alumno_id and al.seguimiento;

create or replace function sincronizar_con_control_banos() returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_banos record;
  v_curso smallint;
  v_grupos int;
  v_matriculas int;
  v_pendientes jsonb;
begin
  if not (es_orientacion() or auth.uid() is null) then
    raise exception 'Solo Orientación puede sincronizar';
  end if;
  select * into v_banos from cursos where activo;
  if not found then raise exception 'No hay curso activo en Acceso a Microsoft 365'; end if;
  insert into curso_academico (nombre) values (left(v_banos.nombre, 5) || right(v_banos.nombre, 2))
    on conflict (nombre) do nothing;
  select id into v_curso from curso_academico where nombre = left(v_banos.nombre, 5) || right(v_banos.nombre, 2);
  update curso_academico set activo = false where activo and id <> v_curso;
  update curso_academico set activo = true where id = v_curso;
  insert into grupo (curso_academico_id, nivel_id, letra, clase_id, tutor_id)
  select v_curso, n.id, coalesce(m[2], ''), c.id,
         (select p.id from personal p where normalizar_nombre(p.nombre_seneca) = normalizar_nombre(c.tutor) and p.activo)
  from grupos c
  cross join lateral regexp_match(c.nombre, '^([1-4])º\s*ESO\s*([A-Z]?)$') m
  join nivel n on n.nombre = m[1] || 'º ESO'
  where c.curso_id = v_banos.id
  on conflict (curso_academico_id, nivel_id, letra) do update
    set clase_id = excluded.clase_id,
        tutor_id = coalesce(excluded.tutor_id, grupo.tutor_id);
  get diagnostics v_grupos = row_count;
  insert into matricula (alumno_id, grupo_id, curso_academico_id)
  select distinct on (al.id) al.id, g.id, v_curso
  from alumno al
  join matriculas ab on ab.alumno_id = al.id and ab.activo
  join grupo g on g.clase_id = ab.clase_id and g.curso_academico_id = v_curso
  where al.activo and al.seguimiento
  on conflict (alumno_id, curso_academico_id) do update set grupo_id = excluded.grupo_id;
  get diagnostics v_matriculas = row_count;
  select coalesce(jsonb_agg(al.apellidos || ', ' || al.nombre order by al.apellidos), '[]') into v_pendientes
  from alumno al
  where al.activo and al.seguimiento
    and not exists (select 1 from matricula m where m.alumno_id = al.id and m.curso_academico_id = v_curso);
  return jsonb_build_object('curso', left(v_banos.nombre, 5) || right(v_banos.nombre, 2),
                            'grupos', v_grupos, 'matriculas', v_matriculas, 'sin_grupo', v_pendientes);
end $$;

revoke execute on function alumno_de_matricula(text, int) from public, anon, authenticated;

commit;

notify pgrst, 'reload schema';

select json_build_object(
  'alumnado', (select count(*) from alumno),
  'en_seguimiento', (select count(*) from alumno where seguimiento),
  'matriculas_sin_enlace', (select count(*) from matriculas where alumno_id is null),
  'seguimiento_enlazado', (select count(distinct alumno_id) from matriculas m join alumno a on a.id = m.alumno_id and a.seguimiento)
) resumen;
