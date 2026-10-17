# Puesta en marcha · fase 1 (grupos, fichas y administración)

Requisito: la fase 0 ya está hecha (tablas, login y tu perfil de Orientación).

## 1. Base de datos (Supabase → SQL Editor)

Ejecuta **en este orden**, cada uno en una consulta nueva, copiando el fichero entero:

| Orden | Fichero | Qué hace |
|---|---|---|
| 1 | `supabase/migrations/20261017000300_padron_control_banos.sql` | Enlaza Orientación con las listas de Control de baños |
| 2 | `privado/importacion_2026-27.sql` | Perfiles (Orientación y tutores) y las 55 fichas del listado actual, con su histórico |

Al final de la consulta 2 sale una fila con el resumen. Debe decir `"grupos": 8`, `"matriculas": 55` y `"sin_grupo": []`.

> `privado/` contiene datos del alumnado: **no se sube a GitHub**. La carpeta «Para subir a GitHub» ya lo excluye.
> El fichero 2 solo se ejecuta **una vez**. Si lo repites, duplicará el alumnado.

## 2. Revisar la importación

`privado/revision_importacion.md` lista qué se ha marcado como *censado* o *sin censar* y los casos en los que no se ha podido deducir el tipo de NEAE. Se corrige desde la ficha de cada alumno/a (**Editar ficha**).

## 3. Publicar

Sube el contenido de «Para subir a GitHub» al repositorio. Vercel publica solo.

## Uso diario

| Perfil | Qué ve |
|---|---|
| Cualquier cuenta @salesianas.org | Grupos, fichas e histórico (consulta) |
| Tutor/a | Además, edita las fichas de su grupo del curso activo y puede añadir alumnado al seguimiento |
| Orientación | Todo, más **Administración** |

**Administración**:
- **Perfiles**: altas, cambios y bajas de Orientación y tutores. El *nombre en Séneca* («Apellidos, Nombre») sirve para asignar las tutorías.
- **Cursos y grupos**: *Sincronizar con Control de baños* (cada septiembre, después de crear el curso nuevo allí), cambiar de tutor/a en un grupo y elegir el curso activo.
