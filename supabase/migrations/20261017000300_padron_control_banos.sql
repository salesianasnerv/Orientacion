-- Fase 1 · Las listas de clase se leen de Control de baños (tablas cursos, clases, alumnos del mismo proyecto).
-- Orientación solo guarda en `alumno` al alumnado con seguimiento, que persiste de un curso a otro.

-- Nombre tal como viene en Séneca ("Apellidos, Nombre"), para enlazar con las listas.
alter table personal add column nombre_seneca text;
alter table alumno add column nombre_seneca text;
alter table grupo add column clase_id int references clases (id) on delete set null;

create function normalizar_nombre(p text) returns text
language sql immutable as $$
  select lower(translate(regexp_replace(trim(p), '\s+', ' ', 'g'), 'ÁÀÉÈÍÌÓÒÚÙÜÑáàéèíìóòúùüñ', 'AAEEIIOOUUUNaaeeiioouuun'))
$$;

create index alumno_nombre_seneca_idx on alumno (normalizar_nombre(nombre_seneca));

-- Toma el curso activo de Control de baños y:
--   1. crea o actualiza el curso académico y lo marca como activo,
--   2. crea los grupos de ESO con su tutor/a (por nombre de Séneca en `personal`),
--   3. matricula al alumnado con seguimiento en su grupo, buscándolo por nombre.
-- Se puede ejecutar varias veces sin duplicar nada.
create function sincronizar_con_control_banos() returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_banos record;
  v_curso smallint;
  v_grupos int;
  v_matriculas int;
  v_pendientes jsonb;
begin
  -- auth.uid() nulo = SQL Editor (propietario de la base de datos)
  if not (es_orientacion() or auth.uid() is null) then
    raise exception 'Solo Orientación puede sincronizar';
  end if;

  select * into v_banos from cursos where activo;
  if not found then raise exception 'Control de baños no tiene curso activo'; end if;

  -- "2026-2027" → "2026-27"
  insert into curso_academico (nombre) values (left(v_banos.nombre, 5) || right(v_banos.nombre, 2))
    on conflict (nombre) do nothing;
  select id into v_curso from curso_academico where nombre = left(v_banos.nombre, 5) || right(v_banos.nombre, 2);
  update curso_academico set activo = false where activo and id <> v_curso;
  update curso_academico set activo = true where id = v_curso;

  insert into grupo (curso_academico_id, nivel_id, letra, clase_id, tutor_id)
  select v_curso, n.id, coalesce(m[2], ''), c.id,
         (select p.id from personal p where normalizar_nombre(p.nombre_seneca) = normalizar_nombre(c.tutor) and p.activo)
  from clases c
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
  join alumnos ab on normalizar_nombre(ab.nombre) = normalizar_nombre(al.nombre_seneca) and ab.activo
  join grupo g on g.clase_id = ab.clase_id and g.curso_academico_id = v_curso
  where al.activo
  on conflict (alumno_id, curso_academico_id) do update set grupo_id = excluded.grupo_id;
  get diagnostics v_matriculas = row_count;

  -- Alumnado con seguimiento que no aparece en las listas de este curso (bajas, cambio de etapa, nombre distinto)
  select coalesce(jsonb_agg(al.apellidos || ', ' || al.nombre order by al.apellidos), '[]') into v_pendientes
  from alumno al
  where al.activo and not exists (select 1 from matricula m where m.alumno_id = al.id and m.curso_academico_id = v_curso);

  return jsonb_build_object('curso', left(v_banos.nombre, 5) || right(v_banos.nombre, 2),
                            'grupos', v_grupos, 'matriculas', v_matriculas, 'sin_grupo', v_pendientes);
end $$;

-- Lista completa de una clase, marcando quién tiene seguimiento de Orientación.
create view padron with (security_invoker = true) as
select g.id as grupo_id,
       g.curso_academico_id,
       ab.id as banos_alumno_id,
       ab.nombre as nombre_seneca,
       ab.orden,
       al.id as alumno_id
from grupo g
join alumnos ab on ab.clase_id = g.clase_id and ab.activo
left join alumno al on normalizar_nombre(al.nombre_seneca) = normalizar_nombre(ab.nombre);

grant select on padron to authenticated;

do $$
declare f text;
begin
  foreach f in array array['normalizar_nombre(text)', 'sincronizar_con_control_banos()']
  loop
    execute format('revoke execute on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated, service_role', f);
  end loop;
end $$;
