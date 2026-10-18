// Lectura en directo de la carpeta «06 - Orientación» de SharePoint con Microsoft Graph (permiso de aplicación,
// solo lectura). Si faltan las variables MS_* o Graph falla, devuelve null y la web usa sus listas fijas.
import { unstable_cache } from "next/cache";

const SITIO = "salesianas.sharepoint.com:/sites/E-NER/Claustro/ESO";
const RAIZ = "06 - Orientación";
const REVALIDAR = 300; // segundos: los cambios de SharePoint se ven como mucho 5 min después

export type Elemento = { id: string; nombre: string; url: string; carpeta: boolean };

export function sharepointConfigurado() {
  return !!(process.env.MS_TENANT_ID && process.env.MS_CLIENT_ID && process.env.MS_CLIENT_SECRET);
}

let token: { valor: string; caduca: number } | null = null;

async function obtenerToken() {
  if (token && token.caduca > Date.now() + 60_000) return token.valor;
  const res = await fetch(`https://login.microsoftonline.com/${process.env.MS_TENANT_ID}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.MS_CLIENT_ID!,
      client_secret: process.env.MS_CLIENT_SECRET!,
      scope: "https://graph.microsoft.com/.default",
    }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Token de Microsoft: ${res.status}`);
  const j = (await res.json()) as { access_token: string; expires_in: number };
  token = { valor: j.access_token, caduca: Date.now() + j.expires_in * 1000 };
  return token.valor;
}

async function graph(ruta: string, json = true) {
  const res = await fetch(`https://graph.microsoft.com/v1.0${ruta}`, {
    headers: { Authorization: `Bearer ${await obtenerToken()}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Graph ${res.status} en ${ruta}`);
  return json ? res.json() : res.arrayBuffer();
}

const mismo = (a: string, b: string) => a.normalize("NFC").toLowerCase() === b.normalize("NFC").toLowerCase();

async function hijosDe(drive: string, itemId: string): Promise<Elemento[]> {
  const out: Elemento[] = [];
  let url: string | null = `/drives/${drive}/items/${itemId}/children?$select=id,name,webUrl,folder&$top=200`;
  while (url) {
    const j = (await graph(url)) as { value: { id: string; name: string; webUrl: string; folder?: object }[]; "@odata.nextLink"?: string };
    out.push(...j.value.map((v) => ({ id: v.id, nombre: v.name.normalize("NFC"), url: v.webUrl, carpeta: !!v.folder })));
    url = j["@odata.nextLink"]?.replace("https://graph.microsoft.com/v1.0", "") ?? null;
  }
  return out;
}

// Sitio, biblioteca y carpeta raíz (06 - Orientación)
async function raiz() {
  const sitio = (await graph(`/sites/${SITIO}`)) as { id: string };
  const drive = (await graph(`/sites/${sitio.id}/drive?$select=id`)) as { id: string };
  const top = await hijosDe(drive.id, "root");
  const r = top.find((e) => mismo(e.nombre, RAIZ));
  if (!r) throw new Error(`No encuentro «${RAIZ}»`);
  return { drive: drive.id, id: r.id };
}

// Recorre la ruta carpeta a carpeta comparando nombres sin importar cómo estén codificadas las tildes
async function resolver(ruta: string) {
  const { drive, id } = await raiz();
  let actual = id;
  for (const parte of ruta.split("/").filter(Boolean)) {
    const h = (await hijosDe(drive, actual)).find((e) => mismo(e.nombre, parte));
    if (!h) throw new Error(`No encuentro «${parte}» en ${ruta}`);
    actual = h.id;
  }
  return { drive, id: actual };
}

// Contenido de una carpeta (relativa a «06 - Orientación») y de sus subcarpetas de primer nivel
export type Carpeta = { archivos: Elemento[]; subcarpetas: { nombre: string; url: string; archivos: Elemento[] }[] };

const listarCacheado = unstable_cache(
  async (ruta: string): Promise<Carpeta> => {
    const { drive, id } = await resolver(ruta);
    const hijos = await hijosDe(drive, id);
    const subcarpetas = await Promise.all(
      hijos.filter((h) => h.carpeta).map(async (c) => ({ nombre: c.nombre, url: c.url, archivos: (await hijosDe(drive, c.id)).filter((x) => !x.carpeta) })),
    );
    return { archivos: hijos.filter((h) => !h.carpeta), subcarpetas };
  },
  ["sharepoint-carpeta"],
  { revalidate: REVALIDAR },
);

export async function listarCarpeta(ruta: string): Promise<Carpeta | null> {
  if (!sharepointConfigurado()) return null;
  try {
    return await listarCacheado(ruta);
  } catch (e) {
    console.error("SharePoint:", e);
    return null;
  }
}

// Descarga un archivo de una carpeta eligiéndolo con una función (p. ej. por parte del nombre)
const descargarCacheado = unstable_cache(
  async (carpeta: string, busca: string, excluye: string): Promise<string | null> => {
    const { drive, id } = await resolver(carpeta);
    const n = (s: string) => s.normalize("NFC").toLowerCase();
    const f = (await hijosDe(drive, id)).find((e) => !e.carpeta && n(e.nombre).endsWith(".docx") && n(e.nombre).includes(n(busca)) && !(excluye && n(e.nombre).includes(n(excluye))));
    if (!f) return null;
    const datos = (await graph(`/drives/${drive}/items/${f.id}/content`, false)) as ArrayBuffer;
    return Buffer.from(datos).toString("base64");
  },
  ["sharepoint-plantilla"],
  { revalidate: REVALIDAR },
);

export async function descargarWord(carpeta: string, busca: string, excluye = ""): Promise<Uint8Array | null> {
  if (!sharepointConfigurado()) return null;
  try {
    const b64 = await descargarCacheado(carpeta, busca, excluye);
    return b64 ? Buffer.from(b64, "base64") : null;
  } catch (e) {
    console.error("SharePoint:", e);
    return null;
  }
}
