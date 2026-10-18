-- Base de datos común «Acceso a Microsoft 365» · Paso 2: todos los grupos y todo el alumnado en una sola lista.
--   grupos     = todos los grupos de todas las etapas (antes «clases» para ESO/Bach y «aul_clases» para Primaria)
--   matriculas = en qué grupo está cada alumno/a en cada curso (antes «alumnos» y «aul_alumnos»)
-- Se conservan los mismos números (id), así que las salidas al baño y los planos guardados siguen enlazados.
-- Los nombres antiguos quedan como vistas que muestran exactamente lo mismo que antes:
--   clases / alumnos         → solo ESO y Bachillerato (Control de baños, Orientación)
--   aul_clases / aul_alumnos → el resto de etapas (Disposición del aula)

begin;

alter table clases rename to grupos;
alter table alumnos rename to matriculas;
alter sequence if exists clases_id_seq rename to grupos_id_seq;
alter sequence if exists alumnos_id_seq rename to matriculas_id_seq;

-- Etapa de cada grupo
alter table grupos add column if not exists etapa text;

create or replace function etapa_de_grupo(p_nombre text) returns text
language sql immutable as $$
  select case
    when p_nombre ilike '%bach%' then 'Bachillerato'
    when p_nombre ilike '%primaria%' or p_nombre ilike '%EPO%' then 'Primaria'
    when p_nombre ilike '%infantil%' then 'Infantil'
    else 'ESO' end
$$;

update grupos set etapa = etapa_de_grupo(nombre) where etapa is null;
alter table grupos alter column etapa set not null;

create or replace function grupos_etapa() returns trigger language plpgsql as $$
begin
  if new.etapa is null then new.etapa := etapa_de_grupo(new.nombre); end if;
  return new;
end $$;
drop trigger if exists grupos_etapa on grupos;
create trigger grupos_etapa before insert on grupos for each row execute function grupos_etapa();

-- Primaria (Disposición del aula) entra en las listas comunes con sus mismos números
insert into grupos (id, curso_id, etapa, nombre, tutor, orden)
  select id, curso_id, etapa, nombre, tutor, orden from aul_clases;
insert into matriculas (id, clase_id, nombre, orden, activo)
  select id, clase_id, nombre, orden, activo from aul_alumnos;

drop table aul_alumnos;
drop table aul_clases;

-- Permisos: los mismos que tenían las cuatro tablas (lectura: claustro; cambios: administración)
drop policy if exists "alta grupo" on grupos;
drop policy if exists "borrar grupo" on grupos;
drop policy if exists "borrar alumno" on matriculas;
create policy "alta grupo"    on grupos     for insert to authenticated with check (es_admin());
create policy "borrar grupo"  on grupos     for delete to authenticated using (es_admin());
create policy "borrar alumno" on matriculas for delete to authenticated using (es_admin());

-- Vistas con los nombres antiguos
create view clases with (security_invoker = true) as
  select id, nombre, tutor, orden, curso_id from grupos
  where etapa in ('ESO', 'Bachillerato');

create view alumnos with (security_invoker = true) as
  select id, clase_id, nombre, orden, activo from matriculas m
  where exists (select 1 from grupos g where g.id = m.clase_id and g.etapa in ('ESO', 'Bachillerato'));

create view aul_clases with (security_invoker = true) as
  select id, curso_id, etapa, nombre, tutor, orden from grupos
  where etapa not in ('ESO', 'Bachillerato');
alter view aul_clases alter column etapa set default 'Primaria';

create view aul_alumnos with (security_invoker = true) as
  select id, clase_id, nombre, orden, activo from matriculas m
  where exists (select 1 from grupos g where g.id = m.clase_id and g.etapa not in ('ESO', 'Bachillerato'));

grant select, insert, update, delete on grupos, matriculas, clases, alumnos, aul_clases, aul_alumnos to authenticated;
revoke all on grupos, matriculas, clases, alumnos, aul_clases, aul_alumnos from anon;
grant usage on sequence grupos_id_seq, matriculas_id_seq to authenticated;

commit;

notify pgrst, 'reload schema';

select etapa, count(distinct g.id) grupos, count(m.id) alumnado
from grupos g left join matriculas m on m.clase_id = g.id group by etapa order by etapa;
