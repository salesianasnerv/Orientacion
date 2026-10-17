import Link from "next/link";
import { Buscador } from "@/components/Buscador";
import { Marco } from "@/components/Marco";
import { alumnadoDelCurso, catalogoMedidas, cursosAcademicos } from "@/lib/consultas";
import { obtenerPerfil } from "@/lib/supabase/server";

export default async function Alumnado({ searchParams }: { searchParams: Promise<{ curso?: string }> }) {
  const perfil = await obtenerPerfil();
  if (!perfil?.es_personal) return <Marco perfil={perfil} portada>{null}</Marco>;

  const [cursos, medidas, { curso: cursoParam }] = await Promise.all([cursosAcademicos(), catalogoMedidas(), searchParams]);
  const curso = cursos.find((c) => String(c.id) === cursoParam) ?? cursos.find((c) => c.activo) ?? cursos[0];
  const filas = curso ? await alumnadoDelCurso(curso.id) : [];

  return (
    <Marco perfil={perfil} curso={curso?.nombre} pestana="alumnado" portada>
      {cursos.length > 1 && (
        <div className="barra">
          <span className="muted small">Curso académico:</span>
          {cursos.map((c) => (
            <Link key={c.id} href={`/?curso=${c.id}`} className={`btn mini ${c.id === curso?.id ? "pri" : ""}`}>{c.nombre}</Link>
          ))}
        </div>
      )}
      {curso ? <Buscador filas={filas} medidas={medidas} cursoId={curso.id} /> : <p className="vacio">Todavía no hay cursos.</p>}
    </Marco>
  );
}
