-- Base de datos común «Acceso a Microsoft 365» · Paso 1: una sola lista de administradores.
-- «permisos» sustituye a administradores (Control de baños y Disposición del aula), hor_admins (Horarios)
-- y res_admin (Reserva de espacios). Los nombres antiguos quedan como vistas con el mismo comportamiento,
-- así que ninguna web necesita cambios. Los permisos de cada persona no cambian.
--   web: 'banos' = listas de alumnado (Control de baños y Disposición del aula) · 'horarios' · 'reservas'
--        · 'pac' · 'orientacion' · 'todas' = cualquier web.
-- Orientación sigue usando el rol de «personal» hasta que se adapte su código (paso 6).

begin;

create table if not exists permisos (
  email  text not null check (email = lower(email)),
  web    text not null check (web in ('todas', 'banos', 'horarios', 'reservas', 'pac', 'orientacion')),
  rol    text not null default 'admin',
  creado timestamptz not null default now(),
  primary key (email, web)
);

insert into permisos (email, web, creado) select lower(email), 'banos', creado from administradores on conflict do nothing;
insert into permisos (email, web)         select lower(email), 'horarios'       from hor_admins      on conflict do nothing;
insert into permisos (email, web, creado) select lower(email), 'reservas', creado from res_admin      on conflict do nothing;

-- Funciones de permisos (mismos nombres que usan las webs)
create or replace function email_jwt() returns text
language sql stable as $$ select lower(coalesce(auth.jwt() ->> 'email', '')) $$;

create or replace function tiene_permiso(p_web text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from permisos where email = email_jwt() and web in (p_web, 'todas'))
$$;

create or replace function es_admin() returns boolean
language sql stable security definer set search_path = public as $$ select tiene_permiso('banos') $$;

create or replace function hor_es_admin() returns boolean
language sql stable security definer set search_path = public as $$ select tiene_permiso('horarios') $$;

create or replace function es_admin_reservas() returns boolean
language sql stable security definer set search_path = public as $$ select tiene_permiso('reservas') $$;

grant execute on function email_jwt(), tiene_permiso(text), es_admin(), hor_es_admin(), es_admin_reservas() to anon, authenticated;

-- Seguridad: cada web solo ve y cambia sus propias filas, con las mismas reglas que tenía
alter table permisos enable row level security;
drop policy if exists "ver permisos" on permisos;
drop policy if exists "dar permiso" on permisos;
drop policy if exists "cambiar permiso" on permisos;
drop policy if exists "quitar permiso" on permisos;

create policy "ver permisos" on permisos for select to authenticated using (
  email = email_jwt()
  or (web = 'banos' and es_admin())
  or (web = 'horarios' and hor_es_admin())
  or (web = 'reservas' and es_admin_reservas())
  or tiene_permiso('todas'));

create policy "dar permiso" on permisos for insert to authenticated with check (
  (web = 'banos' and es_admin() and email like '%@salesianas.org')
  or (web = 'horarios' and hor_es_admin())
  or (web = 'reservas' and es_admin_reservas() and email like '%@salesianas.org')
  or tiene_permiso('todas'));

create policy "cambiar permiso" on permisos for update to authenticated
  using ((web = 'horarios' and hor_es_admin()) or tiene_permiso('todas'))
  with check ((web = 'horarios' and hor_es_admin()) or tiene_permiso('todas'));

create policy "quitar permiso" on permisos for delete to authenticated using (
  (web = 'banos' and es_admin() and email <> email_jwt())
  or (web = 'horarios' and hor_es_admin())
  or (web = 'reservas' and es_admin_reservas() and email <> email_jwt())
  or (tiene_permiso('todas') and email <> email_jwt()));

-- Las tablas antiguas pasan a ser vistas sobre «permisos» (se pueden leer, añadir y borrar igual que antes).
-- Si el script ya se ejecutó, ya son vistas: solo se borran mientras sigan siendo tablas.
do $$
declare t text;
begin
  foreach t in array array['administradores', 'hor_admins', 'res_admin'] loop
    if exists (select 1 from pg_tables where schemaname = 'public' and tablename = t) then
      execute format('drop table public.%I', t);
    end if;
  end loop;
end $$;

create or replace view administradores with (security_invoker = true) as
  select email, creado, web from permisos where web = 'banos' with cascaded check option;
create or replace view hor_admins with (security_invoker = true) as
  select email, web from permisos where web = 'horarios' with cascaded check option;
create or replace view res_admin with (security_invoker = true) as
  select email, creado, web from permisos where web = 'reservas' with cascaded check option;

alter view administradores alter column web set default 'banos';
alter view administradores alter column creado set default now();
alter view hor_admins alter column web set default 'horarios';
alter view res_admin alter column web set default 'reservas';
alter view res_admin alter column creado set default now();

-- Los correos se guardan siempre en minúsculas
create or replace function permisos_minusculas() returns trigger language plpgsql as $$
begin new.email := lower(trim(new.email)); return new; end $$;
drop trigger if exists permisos_minusculas on permisos;
create trigger permisos_minusculas before insert or update on permisos
  for each row execute function permisos_minusculas();

grant select, insert, update, delete on permisos, administradores, hor_admins, res_admin to authenticated;
revoke all on permisos, administradores, hor_admins, res_admin from anon;

commit;

notify pgrst, 'reload schema';

select web, count(*) personas from permisos group by web order by web;
