import Link from "next/link";
import { Marco } from "@/components/Marco";
import { nombreGrupo } from "@/lib/datos";
import { cursosAcademicos, gruposDelCurso } from "@/lib/consultas";
import { createClient, obtenerPerfil } from "@/lib/supabase/server";

export default async function Grupos({ searchParams }: { searchParams: Promise<{ curso?: string }> }) {
  const perfil = await obtenerPerfil();
  if (!perfil?.es_personal) return <Marco perfil={perfil}>{null}</Marco>;

  const [cursos, { curso: cursoParam }] = await Promise.all([cursosAcademicos(), searchParams]);
  const curso = cursos.find((c) => String(c.id) === cursoParam) ?? cursos.find((c) => c.activo) ?? cursos[0];
  const supabase = await createClient();
  const [grupos, { data: matriculas }] = curso
    ? await Promise.all([gruposDelCurso(curso.id), supabase.from("matricula").select("grupo_id").eq("curso_academico_id", curso.id)])
    : [[], { data: [] as { grupo_id: string }[] }];

  const enSeguimiento = new Map<string, number>();
  matriculas?.forEach((m) => enSeguimiento.set(m.grupo_id, (enSeguimiento.get(m.grupo_id) ?? 0) + 1));

  return (
    <Marco perfil={perfil} curso={curso?.nombre} pestana="grupos" migas={<>Atención a la diversidad › <b>Grupos</b> {curso?.nombre}</>}>
      {cursos.length > 1 && (
        <div className="barra">
          {cursos.map((c) => <Link key={c.id} href={`/grupos?curso=${c.id}`} className={`btn mini ${c.id === curso?.id ? "pri" : ""}`}>{c.nombre}</Link>)}
        </div>
      )}
      {grupos.length === 0 ? (
        <p className="vacio">No hay grupos en este curso. Orientación puede crearlos en Administración → Cursos y grupos.</p>
      ) : (
        <ul className="rejilla-grupos">
          {grupos.map((g) => {
            const propio = g.tutor?.email?.toLowerCase() === perfil.email?.toLowerCase();
            return (
              <li key={g.id}>
                <Link href={`/grupo/${g.id}`} className={`tarjeta-grupo ${propio ? "propio" : ""}`}>
                  <h3>{nombreGrupo(g)} {propio && <span className="chip verde">Tu tutoría</span>}</h3>
                  <p className="tutor">{g.tutor?.nombre ?? "Sin tutor/a asignado"}</p>
                  <span className="cifra">{enSeguimiento.get(g.id) ?? 0}</span> <span className="muted small">en seguimiento</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Marco>
  );
}
