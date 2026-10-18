import Link from "next/link";
import { notFound } from "next/navigation";
import { Marco } from "@/components/Marco";
import { nombreCompleto, nombreGrupo } from "@/lib/datos";
import { obtenerPerfil } from "@/lib/supabase/server";
import { datosSeguimiento } from "./datos";
import { VistaDocumento } from "./VistaDocumento";

export default async function DocumentoSeguimiento({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ curso?: string }> }) {
  const [{ id }, { curso: cursoParam }] = await Promise.all([params, searchParams]);
  const perfil = await obtenerPerfil();
  if (!perfil?.es_personal) return <Marco perfil={perfil}>{null}</Marco>;

  const r = await datosSeguimiento(id, cursoParam);
  if (!r) notFound();
  const { alumno, curso, ficha, grupo } = r.d;
  const base = `/alumno/${id}/seguimiento/docx?curso=${curso?.id ?? ""}`;

  return (
    <Marco
      perfil={perfil}
      curso={curso?.nombre}
      pestana="alumnado"
      migas={<>
        {grupo && <><Link href={`/grupo/${grupo.id}`}>{nombreGrupo(grupo)}</Link> › </>}
        <Link href={`/alumno/${id}?curso=${curso?.id ?? ""}`}>{nombreCompleto(alumno)}</Link> › <b>Documento de seguimiento</b>
      </>}
    >
      <div className="no-imprimir">
        <h1 style={{ marginBottom: 4 }}>Documento de seguimiento</h1>
        <p className="muted" style={{ marginTop: 0 }}>
          Plantilla «{ficha?.censado ? "Alumnado censado" : "Alumnado sin censar"}» · {curso?.nombre} · rellena con los datos de la ficha.
        </p>
      </div>
      <VistaDocumento urlVista={`${base}&vista=1`} urlWord={base} />
    </Marco>
  );
}
