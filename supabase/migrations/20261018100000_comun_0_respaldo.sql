-- Base de datos común «Acceso a Microsoft 365» · Paso 0: copia de seguridad.
-- Copia todas las tablas de «public» al esquema «respaldo_20261018» (no visible desde las webs).
-- Para recuperar una tabla: insert into public.X select * from respaldo_20261018.X;

create schema if not exists respaldo_20261018;
revoke all on schema respaldo_20261018 from public, anon, authenticated;

do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('drop table if exists respaldo_20261018.%I', t);
    execute format('create table respaldo_20261018.%I as table public.%I', t, t);
  end loop;
end $$;

select tablename, (xpath('/row/n/text()', query_to_xml(format('select count(*) n from respaldo_20261018.%I', tablename), false, true, '')))[1]::text::int filas
from pg_tables where schemaname = 'respaldo_20261018' order by 1;
