-- Catálogos iniciales, tomados de "Proceso Derivación Secundaria" (docs 1, 1.1, 1.2, 1.3)
-- y de las plantillas "Alumnado censado" / "Alumnado sin censar".

insert into etapa (id, codigo, nombre) values (3, 'ESO', 'Educación Secundaria Obligatoria');
insert into nivel (id, etapa_id, orden, nombre) values
  (31, 3, 1, '1º ESO'), (32, 3, 2, '2º ESO'), (33, 3, 3, '3º ESO'), (34, 3, 4, '4º ESO');

insert into curso_academico (nombre, activo) values ('2026-27', true);

insert into tipo_neae (codigo, nombre) values
  ('NEE',  'Necesidades educativas especiales'),
  ('DIA',  'Dificultades de aprendizaje'),
  ('AACC', 'Altas capacidades intelectuales'),
  ('COM',  'Compensación educativa');

insert into catalogo_medida (codigo, nombre, bloque, orden, descripcion) values
  -- Medidas generales
  ('AP2',  'Apoyo en grupos ordinarios mediante un segundo profesor dentro del aula', 'general', 1,
   'Refuerzo de aprendizajes instrumentales básicos con atención individualizada dentro del aula.'),
  ('DG',   'Desdoblamientos de grupos', 'general', 2, null),
  ('AG',   'Agrupamientos flexibles', 'general', 3, null),
  ('ATL',  'Sustitución de la segunda lengua extranjera por un Área Lingüística de carácter transversal', 'general', 4, null),
  ('AT',   'Acción tutorial', 'general', 5,
   'Tutela, acompañamiento y seguimiento del alumnado; cooperación con las familias.'),
  ('TC',   'Metodologías basadas en el trabajo colaborativo en grupos heterogéneos, tutoría entre iguales y aprendizaje por proyectos', 'general', 6, null),
  ('ABS',  'Actuaciones de prevención y control del absentismo', 'general', 7, null),
  ('TR',   'Actuaciones de coordinación en el proceso de tránsito entre ciclos y etapas', 'general', 8, null),
  ('AR',   'Actividades de refuerzo', 'general', 9, null),
  ('AP',   'Actividades de profundización', 'general', 10, null),
  ('EX',   'Exención de francés', 'general', 11, null),
  ('AMB',  'Agrupación de áreas por ámbitos', 'general', 12, null),
  ('EVPS', 'Evaluación psicopedagógica', 'general', 13, null),
  -- Medidas específicas (requieren evaluación psicopedagógica)
  ('AAC',  'Adaptaciones de acceso al currículo', 'especifica', 1,
   'Provisión o adaptación de recursos específicos para acceder al currículo.'),
  ('PT/PE','Apoyo de PT y Programa Específico', 'especifica', 2,
   'Estimulación de procesos implicados en el aprendizaje (atención, memoria, lenguaje, habilidades sociales…).'),
  ('ACS',  'Adaptación curricular significativa (NEE)', 'especifica', 3,
   'Modifica elementos del currículo; requiere desfase de al menos dos cursos en el área.'),
  ('ACAI', 'Adaptación curricular para altas capacidades intelectuales', 'especifica', 4,
   'Ampliación de un área con criterios de evaluación de niveles superiores.'),
  ('AH',   'Atención educativa por hospitalización o convalecencia domiciliaria', 'especifica', 5, null),
  ('FLX',  'Flexibilización', 'especifica', 6, null),
  -- Programas de atención a la diversidad
  ('PRA',  'Programa de refuerzo del aprendizaje', 'programa', 1,
   'No promociona, áreas pendientes, dificultades detectadas o NEAE con evaluación psicopedagógica. Se registra en Séneca.'),
  ('PF',   'Programa de profundización', 'programa', 2,
   'Alumnado altamente motivado o con altas capacidades; enriquecimiento sin modificar criterios de evaluación.');

insert into catalogo_medida (nombre, bloque, orden) values
  -- Metodología (MET)
  ('Ubicación cercana al profesor/a', 'metodologia', 1),
  ('Espacios correctamente iluminados', 'metodologia', 2),
  ('Espacios de explicación que posibiliten una adecuada interacción con el grupo clase', 'metodologia', 3),
  ('Distribución de espacios que posibiliten la interacción entre iguales', 'metodologia', 4),
  ('Ubicación del material accesible', 'metodologia', 5),
  ('Más tiempo para realización de tareas', 'metodologia', 6),
  ('Reducción y/o priorización en el número de actividades a realizar', 'metodologia', 7),
  ('Eliminación de copia de enunciados de una actividad', 'metodologia', 8),
  ('Tutorización entre iguales', 'metodologia', 9),
  ('Reducción y/o priorización de apartados en una actividad', 'metodologia', 10),
  ('Presentación de los contenidos de forma gráfica o en imágenes a través de un texto escrito', 'metodologia', 11),
  ('Selección de aspectos relevantes y esenciales del contenido que se pretende que el alumno/a aprenda', 'metodologia', 12),
  ('Secuenciación de actividades', 'metodologia', 13),
  ('Uso de recursos de apoyo visuales, manipulativos… (recta numérica, abecedario, tabla periódica, ábaco…)', 'metodologia', 14),
  -- Evaluación (EV)
  ('Observación diaria del trabajo del alumnado', 'evaluacion', 1),
  ('Registros anecdóticos', 'evaluacion', 2),
  ('Uso de porfolio', 'evaluacion', 3),
  ('Diarios de clase', 'evaluacion', 4),
  ('Listas de control', 'evaluacion', 5),
  ('Escalas de estimación', 'evaluacion', 6),
  ('Uso de recursos de apoyo visuales, manipulativos…', 'evaluacion', 7),
  -- Adaptación de las pruebas escritas
  ('Realización de la prueba haciendo uso de un ordenador', 'prueba_escrita', 1),
  ('Presentación de las preguntas de forma secuenciada y separada', 'prueba_escrita', 2),
  ('Presentación de los enunciados de forma gráfica o en imágenes además de texto escrito', 'prueba_escrita', 3),
  ('Exámenes en Braille o con texto ampliado', 'prueba_escrita', 4),
  ('Selección de aspectos relevantes y esenciales del contenido', 'prueba_escrita', 5),
  ('Sustitución de la prueba escrita por una prueba oral o una entrevista', 'prueba_escrita', 6),
  ('Lectura de las preguntas por parte del profesor o profesora', 'prueba_escrita', 7),
  ('Supervisión del examen durante su realización', 'prueba_escrita', 8),
  ('Más tiempo para la realización de una prueba escrita', 'prueba_escrita', 9),
  ('Adaptación de las preguntas indicando ejemplos o pequeñas ayudas', 'prueba_escrita', 10);

insert into catalogo_necesidad (nombre, orden) values
  ('Absentismo', 1),
  ('Conocimientos previos', 2),
  ('Psicomotricidad', 3),
  ('Déficit de atención', 4),
  ('Hábitos de trabajo y técnicas de trabajo intelectual', 5),
  ('Intelectual', 6),
  ('Comprensión y expresión oral y escrita', 7),
  ('Razonamiento lógico y resolución de problemas', 8),
  ('Elevado nº de materias suspensas / pendientes', 9),
  ('Altas capacidades', 10),
  ('Alta motivación', 11),
  ('Otras', 12);
