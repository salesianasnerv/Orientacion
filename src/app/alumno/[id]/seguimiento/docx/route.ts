import { generarDocumento } from "@/lib/documentoSeguimiento";
import { descargarWord } from "@/lib/sharepoint";
import { obtenerPerfil } from "@/lib/supabase/server";
import { datosSeguimiento } from "../datos";

// Word del documento de seguimiento. ?vista=1 → versión para la vista previa / PDF (casillas como ☒ / ☐)
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = new URL(req.url);
  const perfil = await obtenerPerfil();
  if (!perfil?.es_personal) return new Response("Sin permiso", { status: 403 });

  const r = await datosSeguimiento(id, url.searchParams.get("curso") ?? undefined);
  if (!r) return new Response("No hay ficha de este curso", { status: 404 });

  const vista = url.searchParams.get("vista") === "1";
  // Plantilla actual de SharePoint (Plantillas › Atención a la Diversidad): «… censado» o «… sin censar»
  const plantilla = r.datos.censado
    ? await descargarWord("Plantillas/Atención a la Diversidad", "censado", "sin censar")
    : await descargarWord("Plantillas/Atención a la Diversidad", "sin censar");
  const docx = await generarDocumento(r.datos, { vista, plantilla });
  return new Response(Buffer.from(docx), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `${vista ? "inline" : "attachment"}; filename="seguimiento.docx"; filename*=UTF-8''${encodeURIComponent(r.nombreArchivo + ".docx")}`,
      "Cache-Control": "no-store",
    },
  });
}
