# SharePoint en directo · Guía de permisos

Con esto la web lee **en directo** la carpeta *ESO › Documentos compartidos › 06 - Orientación*:

- **Recursos** y **Plantillas** muestran lo que haya en sus carpetas (cada subcarpeta es un apartado). Documentos nuevos, renombrados o borrados se ven solos.
- **Proceso de derivación** enlaza cada documento por su número («2. …», «1.1. …»), aunque cambie el resto del nombre.
- El **documento de seguimiento** de la ficha se genera con la plantilla actual de *Plantillas › Atención a la Diversidad* (el archivo cuyo nombre contiene «censado» o «sin censar»).
- Los cambios tardan **como mucho 5 minutos** en verse.

Sin estos permisos la web sigue funcionando igual que ahora (listas fijas). En *Administración* hay un aviso «SharePoint en directo» que dice si está conectado.

El permiso es **solo de lectura** y se guarda en Vercel (nunca en GitHub). Los pasos 1 a 4 se hacen en la app de Entra ID **«Acceso a Microsoft 365»** (la única del colegio) y los tiene que hacer alguien con rol de **administrador global** (o administrador de aplicaciones + administrador de SharePoint) del colegio. Tiempo: 15 minutos.

## 1. Abrir la app «Acceso a Microsoft 365» en Entra ID

Se usa **la misma app** que ya usan todas las webs del colegio para iniciar sesión (y que está vinculada al Supabase del mismo nombre). No hay que crear otra.

1. Entra en <https://entra.microsoft.com> → **Aplicaciones → Registros de aplicaciones → Todas las aplicaciones** → **Acceso a Microsoft 365**.
2. En su página de *Información general* copia y guarda:
   - **Id. de aplicación (cliente)** → será `MS_CLIENT_ID`
   - **Id. de directorio (inquilino)** → será `MS_TENANT_ID`

Lo que se añade en los pasos 2 a 4 no cambia nada del inicio de sesión de las demás webs.

## 2. Crear un secreto para Orientación

1. **Certificados y secretos → Secretos de cliente → Nuevo secreto de cliente**. Descripción `Orientación (Vercel)`, caducidad **24 meses**.
2. Copia la columna **Valor** en ese momento (luego ya no se puede ver) → será `MS_CLIENT_SECRET`.
3. Apunta en el calendario la fecha de caducidad: ese día habrá que crear otro y cambiarlo en Vercel.

Si ya existe otro secreto (por ejemplo, el que usa Supabase para el inicio de sesión), **no lo borres ni lo cambies**: cada uso tiene el suyo y se puede retirar por separado.

## 3. Dar el permiso de Microsoft Graph

1. **Permisos de API → Agregar un permiso → Microsoft Graph → Permisos de aplicación**.
2. Busca y marca **`Sites.Selected`** → **Agregar permisos**.
3. Pulsa **Conceder consentimiento de administrador para…** → Sí. Debe quedar en verde «Concedido».

`Sites.Selected` no da acceso a nada por sí solo: en el paso 4 se elige qué sitio puede leer.

## 4. Permitir leer solo el sitio E-NER

1. Abre el Explorador de Graph: <https://developer.microsoft.com/graph/graph-explorer> e inicia sesión con la cuenta de administrador.
2. Arriba, en **Modify permissions**, da consentimiento a `Sites.FullControl.All` (solo para la cuenta de administrador, para poder hacer este paso).
3. Consulta **GET**:

       https://graph.microsoft.com/v1.0/sites/salesianas.sharepoint.com:/sites/E-NER

   En la respuesta copia el valor de `"id"` (algo como `salesianas.sharepoint.com,1234…,5678…`).

4. Cambia a **POST**, con la dirección (sustituye `ID-DEL-SITIO`):

       https://graph.microsoft.com/v1.0/sites/ID-DEL-SITIO/permissions

   y en **Request body** pega (sustituye `MS_CLIENT_ID` por el del paso 1):

       {
         "roles": ["read"],
         "grantedToIdentities": [
           { "application": { "id": "MS_CLIENT_ID", "displayName": "Acceso a Microsoft 365" } }
         ]
       }

   Pulsa **Run query**: debe responder `201 Created`.

> Alternativa más sencilla pero más amplia: en el paso 3 usar `Sites.Read.All` en lugar de `Sites.Selected` y saltarse el paso 4. Da lectura a **todos** los sitios del colegio, así que es preferible `Sites.Selected`.

## 5. Poner las claves en Vercel

1. <https://vercel.com> → proyecto **orientacion-nervion** → **Settings → Environment Variables**.
2. Añade las tres (entorno *Production*, y también *Preview* si se usa):

   | Nombre | Valor |
   |---|---|
   | `MS_TENANT_ID` | Id. de directorio (paso 1) |
   | `MS_CLIENT_ID` | Id. de aplicación (paso 1) |
   | `MS_CLIENT_SECRET` | Valor del secreto (paso 2) |

3. **Deployments** → el último → **⋯ → Redeploy**.

## 6. Comprobar

1. Entra en la web → **Administración**: el aviso debe decir «SharePoint en directo: **conectado**».
2. Sube un archivo de prueba a *06 - Orientación › Recursos*: en unos 5 minutos aparece en **Recursos**. Bórralo después.

## Problemas frecuentes

| Aviso en Administración | Causa |
|---|---|
| «sin configurar» | Faltan las variables en Vercel o no se ha hecho *Redeploy* |
| «configurado, pero Microsoft no da acceso» | Secreto mal copiado o caducado (paso 2), falta el consentimiento (paso 3) o el permiso del sitio (paso 4) |
| Un apartado de Plantillas sale con otro nombre | Se ha renombrado la carpeta en SharePoint: avisa para actualizar los títulos |
