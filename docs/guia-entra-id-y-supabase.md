# Guía fase 0 · Puesta en marcha

Tiempo estimado: 10 min. La plataforma usa el proyecto de Supabase **«Acceso a Microsoft 365»** (`hblayjaknhfxieqbzrlq`), común a todas las webs del colegio que entran con Microsoft 365 (Horarios, Control de baños, Orientación, PAC…). El inicio de sesión ya está configurado ahí con la app de Entra ID del mismo nombre, así que **no hay que tocar Entra ID**.

## Convivencia con las demás webs

- Cada web tiene sus tablas (`alumno`, `curso_academico`… de Orientación frente a las listas comunes `alumnos`, `cursos`…): no se pisan.
- Los permisos de cada app son independientes: ser administrador/a en otra web no da permisos en Orientación, y al revés.
- Solo entran cuentas **@salesianas.org** que inicien sesión con Microsoft (tabla `configuracion`, clave `dominios_permitidos`).

## 1. Crear las tablas

1. Supabase → **SQL Editor** → *New query*.
2. Abre `supabase/migrations/20261017000100_esquema_inicial.sql` con un editor de texto, copia **todo** su contenido, pégalo y pulsa **Run**.
3. Nueva consulta con `supabase/migrations/20261017000200_catalogos.sql` → **Run**.
4. Date de alta como Orientación (pega solo estas dos líneas, con tus datos):

       insert into personal (email, nombre, rol)
       values ('nombre.apellido@salesianas.org', 'Tu nombre y apellidos', 'orientacion');

5. En **Table Editor** comprueba que `catalogo_medida` tiene 52 filas y `nivel`, 4.

## 2. Permitir la vuelta a la nueva web

Supabase → **Authentication → URL Configuration → Redirect URLs** → *Add URL*:

- `http://localhost:3000/**` (para probar en tu ordenador)
- Cuando la publiquemos, también su dirección (p. ej. `https://orientacion-xxx.vercel.app/**`).

**No cambies la *Site URL***: la comparten todas las webs.

## 3. Conectar la web

1. En la carpeta del proyecto, copia `.env.example` como `.env.local`.
2. Rellena los datos del proyecto «Acceso a Microsoft 365» (Supabase → Project Settings → API):

       NEXT_PUBLIC_SUPABASE_URL=https://hblayjaknhfxieqbzrlq.supabase.co
       NEXT_PUBLIC_SUPABASE_ANON_KEY=(el valor de supabaseAnonKey)

## 4. Probar

1. En la carpeta del proyecto ejecuta `npm run dev` y abre <http://localhost:3000>.
2. **Entrar con Microsoft 365** → debe aparecer tu email y el perfil *Orientación (edición completa)*.
3. Con la cuenta de otro/a docente debe salir *Consulta*.

## Problemas frecuentes

| Síntoma | Causa |
|---|---|
| Tras iniciar sesión acabas en otra web del colegio | Falta `http://localhost:3000/**` en Redirect URLs (paso 2) |
| Vuelve a `/login?error=1` | Lo mismo, o la clave `anon` está mal copiada |
| «Acceso no autorizado» | La cuenta no es @salesianas.org |
| Perfil *Consulta* siendo tú de Orientación | El email del paso 1.4 no coincide con el de tu cuenta |
| `syntax error at or near "```"` | Se copiaron las marcas de formato del chat; pega solo el SQL |

## Más adelante (fase 4: expedientes de SharePoint)

Para leer las carpetas de SharePoint en directo: [guia-sharepoint-en-directo.md](guia-sharepoint-en-directo.md).
