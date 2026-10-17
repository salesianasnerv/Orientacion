-- Enlaces a las carpetas de SharePoint (sitio E-NER › Claustro › ESO › 06 - Orientación).
-- Los documentos siguen en SharePoint, con sus permisos; la web solo guarda el enlace.

alter table alumno add column expediente_url text check (expediente_url ~ '^https://salesianas\.sharepoint\.com/');
alter table alumno add column carpeta_medidas_url text check (carpeta_medidas_url ~ '^https://salesianas\.sharepoint\.com/');

insert into configuracion (clave, valor) values
  ('sharepoint_orientacion', to_jsonb('https://salesianas.sharepoint.com/sites/E-NER/Claustro/ESO/Documentos%20compartidos/Forms/AllItems.aspx?id=%2Fsites%2FE%2DNER%2FClaustro%2FESO%2FDocumentos%20compartidos%2F06%20%2D%20Orientaci%C3%B3n'::text)),
  ('sharepoint_expedientes', to_jsonb('https://salesianas.sharepoint.com/sites/E-NER/Claustro/ESO/Documentos%20compartidos/Forms/AllItems.aspx?id=%2Fsites%2FE%2DNER%2FClaustro%2FESO%2FDocumentos%20compartidos%2F06%20%2D%20Orientaci%C3%B3n%2FExpedientes'::text))
on conflict (clave) do nothing;
