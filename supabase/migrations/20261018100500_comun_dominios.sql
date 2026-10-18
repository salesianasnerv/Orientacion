-- Base de datos común «Acceso a Microsoft 365»: cuentas del colegio con los dos dominios.
-- Algunas cuentas del mismo Microsoft 365 son @salesianes.org (p. ej. Nuria González).
-- Solo pueden iniciar sesión cuentas de nuestro Microsoft 365, así que aceptar el dominio no abre la puerta a nadie de fuera.

begin;

create or replace function es_cuenta_colegio(p_email text) returns boolean
language sql immutable as $$
  select coalesce(split_part(lower(p_email), '@', 2) in ('salesianas.org', 'salesianes.org'), false)
$$;

create or replace function es_profesorado() returns boolean
language sql stable as $$ select es_cuenta_colegio(auth.jwt() ->> 'email') $$;

create or replace function pac_es_profesorado() returns boolean
language sql stable as $$ select es_cuenta_colegio(pac_email()) $$;

grant execute on function es_cuenta_colegio(text) to anon, authenticated;

drop policy if exists "dar permiso" on permisos;
create policy "dar permiso" on permisos for insert to authenticated with check (
  (web = 'banos' and es_admin() and es_cuenta_colegio(email))
  or (web = 'horarios' and hor_es_admin())
  or (web = 'reservas' and es_admin_reservas() and es_cuenta_colegio(email))
  or (web = 'pac' and pac_es_admin() and es_cuenta_colegio(email))
  or tiene_permiso('todas'));

commit;
