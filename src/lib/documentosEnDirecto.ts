// Convierte una carpeta de SharePoint leída en directo en apartados de documentos para ListaDocumentos.
import type { Apartado, Documento } from "@/contenido/portal";
import { listarCarpeta, type Elemento } from "@/lib/sharepoint";

const sinExtension = (n: string) => n.replace(/\.[^.]+$/, "");

// Un documento por nombre; si hay Word y PDF con el mismo nombre, una sola fila con los dos enlaces
function documentos(archivos: Elemento[]): Documento[] {
  const porNombre = new Map<string, Documento>();
  for (const a of archivos) {
    if (a.nombre.startsWith("~$") || a.nombre.startsWith(".")) continue;
    const base = sinExtension(a.nombre);
    const ext = a.nombre.split(".").pop()?.toLowerCase() ?? "";
    const d = porNombre.get(base) ?? { titulo: base, ruta: a.nombre, versiones: [] };
    d.versiones!.push({ ext, url: a.url });
    porNombre.set(base, d);
  }
  return [...porNombre.values()].sort((a, b) => a.titulo.localeCompare(b.titulo, "es", { numeric: true }));
}

// Cada subcarpeta es un apartado; los archivos sueltos van en «general». `titulos` renombra y ordena apartados.
export async function apartadosEnDirecto(ruta: string, opciones: { general: string; titulos?: [string, string][] }): Promise<Apartado[] | null> {
  const c = await listarCarpeta(ruta);
  if (!c) return null;
  const titulos = opciones.titulos ?? [];
  const norm = (s: string) => s.normalize("NFC").toLowerCase();
  const orden = (n: string) => { const i = titulos.findIndex(([k]) => norm(k) === norm(n)); return i < 0 ? 999 : i; };
  const apartados: Apartado[] = [...c.subcarpetas]
    .sort((a, b) => orden(a.nombre) - orden(b.nombre) || a.nombre.localeCompare(b.nombre, "es"))
    .map((s) => ({ titulo: titulos.find(([k]) => norm(k) === norm(s.nombre))?.[1] ?? s.nombre, documentos: documentos(s.archivos) }))
    .filter((a) => a.documentos.length);
  const sueltos = documentos(c.archivos);
  if (sueltos.length) apartados.unshift({ titulo: opciones.general, documentos: sueltos });
  return apartados;
}
