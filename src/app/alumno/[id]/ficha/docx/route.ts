import { generarFichaWord } from "@/lib/fichaWord";
import { obtenerPerfil } from "@/lib/supabase/server";
import { datosFicha } from "../datos";

// Ficha del alumno/a en Word, sobre la hoja corporativa vertical
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const perfil = await obtenerPerfil();
  if (!perfil?.es_personal) return new Response("Sin permiso", { status: 403 });

  const r = await datosFicha(id, new URL(req.url).searchParams.get("curso") ?? undefined);
  if (!r) return new Response("No hay ficha de este curso", { status: 404 });

  const docx = await generarFichaWord(r.datos);
  return new Response(Buffer.from(docx), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="ficha.docx"; filename*=UTF-8''${encodeURIComponent(r.nombreArchivo + ".docx")}`,
      "Cache-Control": "no-store",
    },
  });
}
