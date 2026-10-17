-- Fase 1b · Medidas marcadas con casillas en la ficha de cada curso.
--   · medida_alumno.evaluacion pasa a ser opcional: vacía = medida aplicada durante el curso
--     (la valoración por evaluación llegará con el documento de seguimiento).
--   · Las observaciones del curso pasan al histórico.
--   · "Atención recibida" y "Propuesta de medidas" (texto libre importado) se convierten en casillas
--     cuando se reconoce la medida, y el texto se conserva como notas de medidas.

alter table medida_alumno alter column evaluacion drop not null;
alter table medida_alumno drop constraint medida_alumno_ficha_id_medida_id_evaluacion_key;
alter table medida_alumno add constraint medida_alumno_unica unique nulls not distinct (ficha_id, medida_id, evaluacion);

-- Reglas para reconocer medidas en el texto libre (además del propio nombre de la medida)
create table regla_medida (
  codigo text primary key references catalogo_medida (codigo) on update cascade,
  patron text not null  -- expresión regular sobre el texto normalizado (minúsculas, sin tildes)
);
insert into regla_medida (codigo, patron) values
  ('AP2',   '\map2\M|segundo profesor'),
  ('AT',    '\(at\)|accion tutorial'),
  ('TC',    '\(tc\)|trabajo cooperativo|tutoria entre iguales|tutorizacion entre iguales'),
  ('ABS',   'absentismo'),
  ('EX',    'exencion de frances|exento de frances'),
  ('PT/PE', '\mpt\M|programa especifico|pedagogia terapeutica'),
  ('ACS',   '\macs\M|adaptacion curricular significativa'),
  ('ACAI',  '\macai\M'),
  ('AAC',   '\maac\M|adaptaciones? de acceso'),
  ('FLX',   'flexibilizacion'),
  ('PRA',   '\mpra\M|programa de refuerzo'),
  ('PF',    '\mpf\M|profundizacion');

alter table regla_medida enable row level security;
create policy lectura_personal on regla_medida for select to authenticated using (es_personal());

-- Convierte los datos de fichas en el formato anterior. Se puede ejecutar varias veces.
create function migrar_fichas_antiguas() returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_hist int; v_medidas int; v_notas int;
begin
  if not (es_orientacion() or auth.uid() is null) then raise exception 'Solo Orientación'; end if;

  -- 1. Observaciones del curso → entrada del histórico de ese curso (arriba del todo)
  insert into historial (alumno_id, curso_academico_id, etiqueta, texto, orden, fuente)
  select f.alumno_id, f.curso_academico_id,
         'Curso ' || ca.nombre || coalesce(' (' || n.nombre || ')', ''),
         trim(f.observaciones),
         coalesce((select max(h.orden) from historial h where h.alumno_id = f.alumno_id), 0) + 1,
         'importacion'
  from ficha_curso f
  join curso_academico ca on ca.id = f.curso_academico_id
  left join matricula m on m.alumno_id = f.alumno_id and m.curso_academico_id = f.curso_academico_id
  left join grupo g on g.id = m.grupo_id
  left join nivel n on n.id = g.nivel_id
  where nullif(trim(f.observaciones), '') is not null;
  get diagnostics v_hist = row_count;
  update ficha_curso set observaciones = null where observaciones is not null;

  -- 2. Medidas reconocidas en el texto → casillas
  insert into medida_alumno (ficha_id, medida_id, evaluacion)
  select f.id, c.id, null
  from ficha_curso f
  cross join lateral (select normalizar_nombre(coalesce(f.atencion_recibida, '') || ' ' || coalesce(f.propuesta_medidas, '')) as t) x
  join catalogo_medida c on c.activa and (
         x.t like '%' || left(normalizar_nombre(c.nombre), 35) || '%'
      or exists (select 1 from regla_medida r where r.codigo = c.codigo and x.t ~ r.patron))
  where nullif(trim(x.t), '') is not null
  on conflict do nothing;
  get diagnostics v_medidas = row_count;

  -- 3. Atención recibida → al principio de las notas de medidas
  update ficha_curso
     set propuesta_medidas = concat_ws(E'\n\n', 'Atención recibida: ' || trim(atencion_recibida), nullif(trim(propuesta_medidas), '')),
         atencion_recibida = null
   where nullif(trim(atencion_recibida), '') is not null;
  get diagnostics v_notas = row_count;

  return jsonb_build_object('entradas_historial', v_hist, 'medidas_marcadas', v_medidas, 'notas_combinadas', v_notas);
end $$;

-- El curso 2025-26 se creó vacío al principio y no se usa
delete from curso_academico c
where c.nombre = '2025-26'
  and not exists (select 1 from grupo g where g.curso_academico_id = c.id)
  and not exists (select 1 from ficha_curso f where f.curso_academico_id = c.id)
  and not exists (select 1 from historial h where h.curso_academico_id = c.id);

revoke execute on function migrar_fichas_antiguas() from public, anon;
grant execute on function migrar_fichas_antiguas() to authenticated, service_role;

select migrar_fichas_antiguas();
