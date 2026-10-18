-- Base de datos común «Acceso a Microsoft 365» · Paso 4: una sola lista de personal.
-- «personal» es la lista común del claustro (con su cuenta de Microsoft 365).
-- Horarios conserva en «hor_docentes» solo lo suyo de cada curso (abreviatura, guardias…) y se enlaza
-- con «personal» por personal.horarios_id (el código del docente en Horarios, p. ej. 'd-ana-felipe').
-- El enlace se guarda en «personal» (no en hor_docentes) porque Horarios es de lectura pública
-- y así los correos no quedan a la vista de cualquiera.

begin;

alter table personal add column if not exists horarios_id text unique;

-- Personas que ya administran alguna web y aún no estaban en «personal»
insert into personal (email, nombre, rol) values
  ('laura.ramos@salesianas.org',   'Laura Ramos',  'docente'),
  ('rocio.cano@salesianas.org',    'Rocío Cano',   'docente'),
  ('anam.gallardo@salesianas.org', 'Ana Gallardo', 'docente')
on conflict (email) do nothing;

update personal p set horarios_id = v.hid
from (values
  ('d-marian-chavez',       'mangeles.chavez@salesianas.org'),
  ('d-ana-felipe',          'ana.felipe@salesianas.org'),
  ('d-angela-rodriguez',    'angela.rodriguez@salesianas.org'),
  ('d-laura-garcia',        'laura.garcia@salesianas.org'),
  ('d-elena-martinez',      'elena.martinez@salesianas.org'),
  ('d-mariola-gutierrez',   'mariadelao.garcia@salesianas.org'),
  ('d-mario-espejo',        'mario.espejo@salesianas.org'),
  ('d-miguel-angel-arcos',  'miguelangel.arcos@salesianas.org'),
  ('d-charo',               'charo.urunuela@salesianas.org'),
  ('d-ana-garcia-pt',       'ana.garcia@salesianas.org'),
  ('d-laura-ramos',         'laura.ramos@salesianas.org'),
  ('d-rocio-cano',          'rocio.cano@salesianas.org'),
  ('d-ana-gallardo',        'anam.gallardo@salesianas.org')
) v(hid, email)
where p.email = v.email and p.horarios_id is null;

-- Vista de consulta: el profesorado de Horarios del curso activo con su cuenta (vacía si falta enlazar)
create or replace view profesorado with (security_invoker = true) as
select d.curso_id as horarios_curso_id, d.id as horarios_id, d.nombre as nombre_horarios, d.abrev,
       d.activo, p.id as personal_id, p.email, p.nombre, p.nombre_seneca
from hor_docentes d
join hor_cursos c on c.id = d.curso_id and c.activo
left join personal p on p.horarios_id = d.id;

grant select on profesorado to authenticated;
revoke all on profesorado from anon;

commit;

notify pgrst, 'reload schema';

select nombre_horarios, email from profesorado order by email nulls first, nombre_horarios;
