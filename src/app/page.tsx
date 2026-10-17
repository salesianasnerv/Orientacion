import Link from "next/link";
import { Marco } from "@/components/Marco";
import { nombreGrupo, type CursoAcademico, type Grupo } from "@/lib/datos";
import { createClient, obtenerPerfil } from "@/lib/supabase/server";

export default async function Inicio({ searchParams }: { searchParams: Promise<{ curso?: string }> }) {
  const perfil = await obtenerPerfil();
  if (!perfil?.es_personal) return <Marco perfil={perfil} portada>{null}</Marco>;

  const supabase = await createClient();
  const { data: cursos } = await supabase.from("curso_academico").select("id, nombre, activo").order("nombre", { ascending: false }).returns<CursoAcademico[]>();
  const { curso: cursoParam } = await searchParams;
  const curso = cursos?.find((c) => String(c.id) === cursoParam) ?? cursos?.find((c) => c.activo) ?? cursos?.[0];

  const [{ data: grupos }, { data: matriculas }] = curso
    ? await Promise.all([
        supabase.from("grupo")
          .select("id, letra, curso_academico_id, nivel:nivel_id(nombre, orden), tutor:tutor_id(nombre, email)")
          .eq("curso_academico_id", curso.id)
          .returns<Grupo[]>(),
        supabase.from("matricula").select("grupo_id").eq("curso_academico_id", curso.id),
      ])
    : [{ data: [] as Grupo[] }, { data: [] as { grupo_id: string }[] }];

  const enSeguimiento = new Map<string, number>();
  matriculas?.forEach((m) => enSeguimiento.set(m.grupo_id, (enSeguimiento.get(m.grupo_id) ?? 0) + 1));
  const ordenados = [...(grupos ?? [])].sort((a, b) => (a.nivel?.orden ?? 0) - (b.nivel?.orden ?? 0) || a.letra.localeCompare(b.letra));
  const total = [...enSeguimiento.values()].reduce((a, b) => a + b, 0);

  return (
    <Marco perfil={perfil} curso={curso?.nombre} pestana="grupos" portada>
      <section className="panel">
        <div className="barra">
          <h2 className="verde" style={{ margin: 0 }}>Grupos de ESO</h2>
          <span className="chip azul">{total} en seguimiento</span>
          <span className="sep" />
          {cursos && cursos.length > 1 && (
            <div className="seg" role="group" aria-label="Curso académico">
              {cursos.map((c) => (
                <Link key={c.id} href={`/?curso=${c.id}`} className="btn mini" style={c.id === curso?.id ? { background: "var(--azul-bg)", color: "var(--azul)", border: 0 } : { border: 0 }}>
                  {c.nombre}
                </Link>
              ))}
            </div>
          )}
        </div>
        {ordenados.length === 0 ? (
          <p className="vacio">No hay grupos en este curso. Orientación puede crearlos en Administración → Cursos.</p>
        ) : (
          <ul className="rejilla-grupos">
            {ordenados.map((g) => {
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
      </section>
    </Marco>
  );
}
