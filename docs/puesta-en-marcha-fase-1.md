# Puesta en marcha · fase 1 (portal, fichas, medidas y administración)

Requisito: la fase 0 ya está hecha (tablas, login y tu perfil de Orientación).

## 1. Base de datos (Supabase → SQL Editor)

Ejecuta **en este orden**, cada uno en una consulta nueva, copiando el fichero entero:

| Orden | Fichero | Qué hace |
|---|---|---|
| 1 | `supabase/migrations/20261017000300_padron_control_banos.sql` | Enlaza con las listas de clase de «Acceso a Microsoft 365» |
| 2 | `supabase/migrations/20261017000400_medidas_por_curso.sql` | Medidas con casillas por curso; quita el curso 2025-26 vacío |
| 3 | `supabase/migrations/20261017000500_enlaces_sharepoint.sql` | Enlaces a expedientes y carpetas de SharePoint |
| 4 | `privado/importacion_2026-27.sql` | Perfiles y las 55 fichas del listado actual, con histórico y medidas |
| 5 | `privado/enlaces_sharepoint.sql` | Enlace al expediente de cada alumno/a (47) y a su carpeta de medidas 26-27 (7) |

Al final de la consulta 4 sale una fila con el resumen: `"grupos": 8`, `"matriculas": 55`, `"sin_grupo": []`.

> `privado/` contiene datos del alumnado: **no se sube a GitHub**. La carpeta «Para subir a GitHub» ya lo excluye.
> La consulta 4 solo se ejecuta **una vez** (si se repite, duplica el alumnado).

## 2. Revisar

- `privado/revision_importacion.md`: censado / sin censar y tipos de NEAE deducidos.
- `privado/enlaces_sharepoint.md`: qué carpeta de expediente se ha enlazado a cada alumno/a. Los que no tienen carpeta se pueden enlazar desde **Editar ficha → Expediente**.
- Las medidas se han marcado automáticamente a partir del texto del listado (139 marcas). El texto original queda en «Notas y concreción de las medidas».

## 3. Publicar

Sube el contenido de «Para subir a GitHub» al repositorio. Vercel publica solo.

## El portal

| Sección | Contenido |
|---|---|
| Atención a la diversidad | **Alumnado** (buscador por nombre, curso/grupo, NEAE, Séneca y medida), **Grupos**, **Proceso de derivación y medidas** |
| Acción tutorial | PAT, Bienestar emocional, TRICs, Safety |
| Orientación académica y profesional | En preparación |
| Plantillas | Seguimiento de medidas, derivación, autorizaciones e información a familias |
| Recursos | Guías (TDAH, dislexia, exámenes, emociones…), legibles dentro del portal o en SharePoint |
| Administración (Orientación) | Perfiles, cursos, tutores, sincronización con «Acceso a Microsoft 365» |
