-- Ficha: «Notas y concreción de las medidas» pasa a tener dos apartados.
--   · Aspectos a tener en cuenta → la columna propuesta_medidas de siempre (se conservan las notas).
--   · Evaluación de las medidas → un texto por evaluación (no se copia al crear la ficha del curso siguiente).

alter table ficha_curso add column if not exists eval_medidas_1 text;
alter table ficha_curso add column if not exists eval_medidas_2 text;
alter table ficha_curso add column if not exists eval_medidas_ordinaria text;
