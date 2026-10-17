# Plataforma de Orientación · Salesianas Nervión

Fichas del alumnado, medidas de atención a la diversidad y seguimiento. Etapa inicial: ESO.

- Diseño: `Plataforma Orientación - Diseño.md` (carpeta de Orientación en OneDrive)
- Puesta en marcha: [docs/guia-entra-id-y-supabase.md](docs/guia-entra-id-y-supabase.md) — usa el mismo proyecto de Supabase (y el mismo acceso Microsoft 365) que Control de baños

## Estructura

| Ruta | Contenido |
|---|---|
| `supabase/migrations/` | Esquema, permisos (RLS) y catálogos de medidas |
| `src/lib/supabase/` | Clientes de Supabase (navegador, servidor, middleware) |
| `src/app/login` | Acceso con Microsoft 365 |
| `src/app/auth/` | Retorno de Microsoft y cierre de sesión |

## Permisos

| Perfil | Cómo se obtiene | Puede |
|---|---|---|
| Orientación | Fila en `personal` con `rol = 'orientacion'` | Todo |
| Tutor/a | `grupo.tutor_id` en el curso activo | Editar su grupo en el curso activo |
| Consulta | Cualquier cuenta Microsoft 365 del colegio (el alumnado no tiene cuenta) | Ver |

## Desarrollo

```bash
cp .env.example .env.local   # rellenar URL y clave anon
npm install
npm run dev
```
