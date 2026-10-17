-- Plataforma de Orientación · esquema inicial (fase 0)
-- Ejecutar en Supabase → SQL Editor (o con `supabase db push`).

create extension if not exists citext;

-- ───────────────────────── Tipos ─────────────────────────
create type rol_personal as enum ('orientacion', 'docente');
create type evaluacion as enum ('inicial', 'primera', 'segunda', 'tercera');
create type bloque_medida as enum ('general', 'metodologia', 'evaluacion', 'prueba_escrita', 'especifica', 'programa');
create type resultado_evaluacion as enum ('positivo', 'insuficiente');

-- ───────────────────────── Configuración y personal ─────────────────────────
-- dominios_permitidos: lista JSON de dominios de email admitidos. Vacía = cualquier cuenta que Entra ID deje entrar.
create table configuracion (
  clave text primary key,
  valor jsonb not null
);
insert into configuracion (clave, valor) values ('dominios_permitidos', '["salesianas.org"]');

-- Solo hace falta dar de alta a Orientación y a los tutores; el resto del profesorado entra en consulta.
create table personal (
  id uuid primary key default gen_random_uuid(),
  email citext not null unique,
  nombre text not null,
  rol rol_personal not null default 'docente',
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

-- ───────────────────────── Estructura académica ─────────────────────────
create table etapa (
  id smallint primary key,
  codigo text not null unique,
  nombre text not null
);

create table nivel (
  id smallint primary key,
  etapa_id smallint not null references etapa,
  orden smallint not null,
  nombre text not null unique
);

create table curso_academico (
  id smallint generated always as identity primary key,
  nombre text not null unique check (nombre ~ '^\d{4}-\d{2}$'),
  activo boolean not null default false
);
create unique index curso_academico_un_solo_activo on curso_academico (activo) where activo;

create table grupo (
  id uuid primary key default gen_random_uuid(),
  curso_academico_id smallint not null references curso_academico,
  nivel_id smallint not null references nivel,
  letra text not null default '',
  tutor_id uuid references personal on delete set null,
  unique (curso_academico_id, nivel_id, letra),
  unique (id, curso_academico_id)
);

-- ───────────────────────── Alumnado ─────────────────────────
create table alumno (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  apellidos text not null,
  fecha_nacimiento date,
  id_seneca text unique,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index alumno_apellidos_idx on alumno (apellidos, nombre);

-- Un alumno/a está en un único grupo por curso académico.
create table matricula (
  id uuid primary key default gen_random_uuid(),
  alumno_id uuid not null references alumno on delete cascade,
  grupo_id uuid not null,
  curso_academico_id smallint not null,
  repetidor boolean not null default false,
  materias_pendientes text,
  foreign key (grupo_id, curso_academico_id) references grupo (id, curso_academico_id) on delete cascade,
  unique (alumno_id, curso_academico_id)
);
create index matricula_grupo_idx on matricula (grupo_id);

create table tipo_neae (
  codigo text primary key,
  nombre text not null
);

-- Ficha de Orientación del alumno/a en un curso académico.
create table ficha_curso (
  id uuid primary key default gen_random_uuid(),
  alumno_id uuid not null references alumno on delete cascade,
  curso_academico_id smallint not null references curso_academico,
  censado boolean not null default false,           -- censado en Séneca → plantilla "Alumnado censado"
  tipo_neae text references tipo_neae,
  diagnostico text,
  dictamen boolean not null default false,
  materias text,
  area text,                                         -- plantilla "sin censar": ÁREA
  profesor_referencia text,                          -- plantilla "sin censar": PROFESOR/A DE REFERENCIA
  atencion_recibida text,
  observaciones text,
  propuesta_medidas text,
  obs_metodologia text,
  obs_evaluacion text,
  obs_pruebas_escritas text,
  updated_at timestamptz not null default now(),
  unique (alumno_id, curso_academico_id)
);

-- Histórico narrativo (incluye Infantil y Primaria, que no tienen curso académico en la app).
create table historial (
  id uuid primary key default gen_random_uuid(),
  alumno_id uuid not null references alumno on delete cascade,
  curso_academico_id smallint references curso_academico,
  etiqueta text not null,                            -- p. ej. "Curso 2024-25 (5º EPO)"
  orden smallint not null default 0,
  texto text not null,
  fuente text not null default 'manual' check (fuente in ('manual', 'importacion')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index historial_alumno_idx on historial (alumno_id, orden);

-- ───────────────────────── Medidas ─────────────────────────
create table catalogo_medida (
  id smallint generated always as identity primary key,
  codigo text unique,
  nombre text not null,
  bloque bloque_medida not null,
  descripcion text,
  orden smallint not null default 0,
  activa boolean not null default true
);

create table medida_alumno (
  id uuid primary key default gen_random_uuid(),
  ficha_id uuid not null references ficha_curso on delete cascade,
  medida_id smallint not null references catalogo_medida,
  evaluacion evaluacion not null,
  concrecion text,
  unique (ficha_id, medida_id, evaluacion)
);
create index medida_alumno_medida_idx on medida_alumno (medida_id);

create table catalogo_necesidad (
  id smallint generated always as identity primary key,
  nombre text not null unique,
  orden smallint not null default 0,
  activa boolean not null default true
);

create table necesidad_detectada (
  id uuid primary key default gen_random_uuid(),
  ficha_id uuid not null references ficha_curso on delete cascade,
  necesidad_id smallint not null references catalogo_necesidad,
  evaluacion evaluacion not null,
  detalle text,
  unique (ficha_id, necesidad_id, evaluacion)
);

-- Resultado y explicación de cada evaluación (plantillas censado / sin censar).
create table valoracion_evaluacion (
  id uuid primary key default gen_random_uuid(),
  ficha_id uuid not null references ficha_curso on delete cascade,
  evaluacion evaluacion not null,
  resultado resultado_evaluacion,
  explicacion text,
  unique (ficha_id, evaluacion)
);

-- ───────────────────────── Auditoría ─────────────────────────
create table auditoria (
  id bigint generated always as identity primary key,
  tabla text not null,
  operacion text not null,
  registro_id text,
  antes jsonb,
  despues jsonb,
  email citext,
  fecha timestamptz not null default now()
);

create function registrar_auditoria() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into auditoria (tabla, operacion, registro_id, antes, despues, email)
  values (
    tg_table_name, tg_op,
    coalesce((to_jsonb(new) ->> 'id'), (to_jsonb(old) ->> 'id')),
    case when tg_op <> 'INSERT' then to_jsonb(old) end,
    case when tg_op <> 'DELETE' then to_jsonb(new) end,
    auth.jwt() ->> 'email'
  );
  return coalesce(new, old);
end $$;

create function tocar_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array['personal', 'grupo', 'alumno', 'matricula', 'ficha_curso', 'historial',
                           'medida_alumno', 'necesidad_detectada', 'valoracion_evaluacion', 'catalogo_medida']
  loop
    execute format('create trigger auditoria_%1$s after insert or update or delete on %1$I
                    for each row execute function registrar_auditoria()', t);
  end loop;
  foreach t in array array['alumno', 'ficha_curso', 'historial']
  loop
    execute format('create trigger updated_at_%1$s before update on %1$I
                    for each row execute function tocar_updated_at()', t);
  end loop;
end $$;

-- ───────────────────────── Funciones de permisos ─────────────────────────
create function email_actual() returns citext
language sql stable as $$ select (auth.jwt() ->> 'email')::citext $$;

-- Personal del centro: sesión iniciada con Microsoft 365 y, si se configuran, dominio permitido.
create function es_personal() returns boolean
language sql stable security definer set search_path = public as $$
  select auth.role() = 'authenticated'
     and coalesce(auth.jwt() -> 'app_metadata' ->> 'provider', '') = 'azure'
     and (
       jsonb_array_length((select valor from configuracion where clave = 'dominios_permitidos')) = 0
       or split_part(email_actual()::text, '@', 2) in (
            select lower(jsonb_array_elements_text(valor)) from configuracion where clave = 'dominios_permitidos')
     )
$$;

create function personal_actual_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from personal where email = email_actual() and activo
$$;

create function es_orientacion() returns boolean
language sql stable security definer set search_path = public as $$
  select es_personal() and exists (
    select 1 from personal where email = email_actual() and activo and rol = 'orientacion')
$$;

-- Tutor/a del grupo del alumno en el curso activo.
create function es_tutor_de(p_alumno uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select es_personal() and exists (
    select 1
    from matricula m
    join grupo g on g.id = m.grupo_id
    join curso_academico ca on ca.id = m.curso_academico_id and ca.activo
    where m.alumno_id = p_alumno and g.tutor_id = personal_actual_id())
$$;

create function es_tutor_activo() returns boolean
language sql stable security definer set search_path = public as $$
  select es_personal() and exists (
    select 1 from grupo g join curso_academico ca on ca.id = g.curso_academico_id and ca.activo
    where g.tutor_id = personal_actual_id())
$$;

create function puede_editar_alumno(p_alumno uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select es_orientacion() or es_tutor_de(p_alumno)
$$;

-- Los tutores solo editan la ficha del curso activo; Orientación, cualquiera.
create function puede_editar_ficha(p_ficha uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select es_orientacion() or exists (
    select 1 from ficha_curso f join curso_academico ca on ca.id = f.curso_academico_id and ca.activo
    where f.id = p_ficha and es_tutor_de(f.alumno_id))
$$;

-- Perfil de la sesión actual para la interfaz.
create function mi_perfil() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'email', email_actual(),
    'es_personal', es_personal(),
    'nombre', (select nombre from personal where email = email_actual() and activo),
    'rol', case when es_orientacion() then 'orientacion'
                when es_tutor_activo() then 'tutor'
                when es_personal() then 'consulta' end,
    'grupos', coalesce((
      select jsonb_agg(n.nombre || case when g.letra <> '' then ' ' || g.letra else '' end order by n.orden, g.letra)
      from grupo g
      join nivel n on n.id = g.nivel_id
      join curso_academico ca on ca.id = g.curso_academico_id and ca.activo
      where g.tutor_id = personal_actual_id()), '[]'::jsonb))
$$;

-- ───────────────────────── Row Level Security ─────────────────────────
do $$
declare t text;
begin
  foreach t in array array['configuracion', 'personal', 'etapa', 'nivel', 'curso_academico', 'grupo', 'alumno',
                           'matricula', 'tipo_neae', 'ficha_curso', 'historial', 'catalogo_medida', 'medida_alumno',
                           'catalogo_necesidad', 'necesidad_detectada', 'valoracion_evaluacion', 'auditoria']
  loop
    execute format('alter table %I enable row level security', t);
  end loop;

  -- Lectura: todo el personal (excepto auditoría).
  foreach t in array array['configuracion', 'personal', 'etapa', 'nivel', 'curso_academico', 'grupo', 'alumno',
                           'matricula', 'tipo_neae', 'ficha_curso', 'historial', 'catalogo_medida', 'medida_alumno',
                           'catalogo_necesidad', 'necesidad_detectada', 'valoracion_evaluacion']
  loop
    execute format('create policy lectura_personal on %I for select to authenticated using (es_personal())', t);
  end loop;

  -- Escritura solo Orientación: datos maestros.
  foreach t in array array['configuracion', 'personal', 'etapa', 'nivel', 'curso_academico', 'grupo',
                           'tipo_neae', 'catalogo_medida', 'catalogo_necesidad']
  loop
    execute format('create policy escritura_orientacion on %I for all to authenticated
                    using (es_orientacion()) with check (es_orientacion())', t);
  end loop;
end $$;

create policy lectura_orientacion on auditoria for select to authenticated using (es_orientacion());

-- Alumnado: altas Orientación y tutores (derivación de alumnado nuevo); bajas solo Orientación.
create policy alta on alumno for insert to authenticated with check (es_orientacion() or es_tutor_activo());
create policy edicion on alumno for update to authenticated
  using (puede_editar_alumno(id)) with check (puede_editar_alumno(id));
create policy baja on alumno for delete to authenticated using (es_orientacion());

-- Matrícula: Orientación, o el tutor/a en su propio grupo del curso activo.
create policy escritura on matricula for all to authenticated
  using (es_orientacion() or exists (
    select 1 from grupo g join curso_academico ca on ca.id = g.curso_academico_id and ca.activo
    where g.id = grupo_id and g.tutor_id = personal_actual_id()))
  with check (es_orientacion() or exists (
    select 1 from grupo g join curso_academico ca on ca.id = g.curso_academico_id and ca.activo
    where g.id = grupo_id and g.tutor_id = personal_actual_id()));

create policy escritura on ficha_curso for all to authenticated
  using (es_orientacion() or (es_tutor_de(alumno_id)
         and curso_academico_id = (select id from curso_academico where activo)))
  with check (es_orientacion() or (es_tutor_de(alumno_id)
         and curso_academico_id = (select id from curso_academico where activo)));

create policy escritura on historial for all to authenticated
  using (puede_editar_alumno(alumno_id)) with check (puede_editar_alumno(alumno_id));

create policy escritura on medida_alumno for all to authenticated
  using (puede_editar_ficha(ficha_id)) with check (puede_editar_ficha(ficha_id));
create policy escritura on necesidad_detectada for all to authenticated
  using (puede_editar_ficha(ficha_id)) with check (puede_editar_ficha(ficha_id));
create policy escritura on valoracion_evaluacion for all to authenticated
  using (puede_editar_ficha(ficha_id)) with check (puede_editar_ficha(ficha_id));

-- Las funciones de permisos no deben ser invocables sin sesión.
-- (Solo las de esta app: el proyecto de Supabase puede compartirse con otras utilidades.)
do $$
declare f text;
begin
  foreach f in array array['email_actual()', 'es_personal()', 'personal_actual_id()', 'es_orientacion()',
                           'es_tutor_de(uuid)', 'es_tutor_activo()', 'puede_editar_alumno(uuid)',
                           'puede_editar_ficha(uuid)', 'mi_perfil()', 'registrar_auditoria()', 'tocar_updated_at()']
  loop
    execute format('revoke execute on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated, service_role', f);
  end loop;
end $$;
