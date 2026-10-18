-- Materias pendientes de cursos anteriores (programa de refuerzo), una fila por materia.
-- Las materias y el profesorado se eligen de la web de Horarios (tablas hor_*); aquí se guarda el nombre.

create table if not exists materia_pendiente (
  id uuid primary key default gen_random_uuid(),
  ficha_id uuid not null references ficha_curso on delete cascade,
  nivel text not null,          -- curso en que se suspendió, p. ej. '1º ESO'
  materia text not null,
  profesor text,                -- docente que hace el seguimiento del programa de refuerzo
  orden smallint not null default 0
);
create index if not exists materia_pendiente_ficha_idx on materia_pendiente (ficha_id);

alter table materia_pendiente enable row level security;
drop policy if exists lectura_personal on materia_pendiente;
drop policy if exists escritura on materia_pendiente;
create policy lectura_personal on materia_pendiente for select to authenticated using (es_personal());
create policy escritura on materia_pendiente for all to authenticated
  using (puede_editar_ficha(ficha_id)) with check (puede_editar_ficha(ficha_id));
