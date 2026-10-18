import Link from "next/link";
import { Marco } from "@/components/Marco";
import { nombreGrupo, type Grupo } from "@/lib/datos";
import { alumnadoDelCurso, cursosAcademicos, gruposDelCurso, type FilaAlumno } from "@/lib/consultas";
import { obtenerPerfil } from "@/lib/supabase/server";

// Cifras de un conjunto de alumnado (todo el curso, un nivel o un grupo)
function resumen(filas: FilaAlumno[]) {
  return {
    total: filas.length,
    censados: filas.filter((f) => f.censado === true).length,
    sinCensar: filas.filter((f) => f.censado === false).length,
    dictamen: filas.filter((f) => f.dictamen).length,
    repetidores: filas.filter((f) => f.repetidor).length,
    pendientes: filas.filter((f) => f.pendientes > 0).length,
  };
}

export default async function Grupos({ searchParams }: { searchParams: Promise<{ curso?: string }> }) {
  const perfil = await obtenerPerfil();
  if (!perfil?.es_personal) return <Marco perfil={perfil}>{null}</Marco>;

  const [cursos, { curso: cursoParam }] = await Promise.all([cursosAcademicos(), searchParams]);
  const curso = cursos.find((c) => String(c.id) === cursoParam) ?? cursos.find((c) => c.activo) ?? cursos[0];
  const [grupos, filas] = curso ? await Promise.all([gruposDelCurso(curso.id), alumnadoDelCurso(curso.id)]) : [[], []];

  const filasDe = new Map<string, FilaAlumno[]>();
  filas.forEach((f) => f.grupoId && filasDe.set(f.grupoId, [...(filasDe.get(f.grupoId) ?? []), f]));

  // Una fila por curso (1º ESO, 2º ESO…), en el orden de los niveles
  const niveles: { nombre: string; grupos: Grupo[] }[] = [];
  grupos.forEach((g) => {
    const nombre = g.nivel?.nombre ?? "Sin nivel";
    const n = niveles.find((x) => x.nombre === nombre) ?? niveles[niveles.push({ nombre, grupos: [] }) - 1];
    n.grupos.push(g);
  });

  const total = resumen(filas);

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
        <>
          <section className="resumen-grupos" aria-label="Resumen del curso">
            <div><span className="cifra">{total.total}</span><span>en seguimiento</span></div>
            <div><span className="cifra azul">{total.censados}</span><span>censados en Séneca</span></div>
            <div><span className="cifra naranja">{total.sinCensar}</span><span>sin censar</span></div>
            <div><span className="cifra morado">{total.dictamen}</span><span>con dictamen</span></div>
            <div><span className="cifra rojo">{total.repetidores}</span><span>repetidores/as</span></div>
            <div><span className="cifra naranja">{total.pendientes}</span><span>con materias pendientes</span></div>
          </section>

          {niveles.map((n) => {
            const r = resumen(n.grupos.flatMap((g) => filasDe.get(g.id) ?? []));
            return (
              <section key={n.nombre} className="nivel-grupos">
                <h2>{n.nombre} <span className="muted small">{r.total} en seguimiento · {r.censados} censados · {r.repetidores} repetidores/as</span></h2>
                <ul className="rejilla-grupos">
                  {n.grupos.map((g) => {
                    const propio = g.tutor?.email?.toLowerCase() === perfil.email?.toLowerCase();
                    const rg = resumen(filasDe.get(g.id) ?? []);
                    return (
                      <li key={g.id}>
                        <Link href={`/grupo/${g.id}`} className={`tarjeta-grupo ${propio ? "propio" : ""}`}>
                          <h3>{nombreGrupo(g)} {propio && <span className="chip verde">Tu tutoría</span>}</h3>
                          <p className="tutor">{g.tutor?.nombre ?? "Sin tutor/a asignado"}</p>
                          <span className="cifra">{rg.total}</span> <span className="muted small">en seguimiento</span>
                          {rg.total > 0 && (
                            <div className="marcas-grupo">
                              {rg.censados > 0 && <span className="chip azul">{rg.censados} censado{rg.censados > 1 ? "s" : ""}</span>}
                              {rg.sinCensar > 0 && <span className="chip naranja">{rg.sinCensar} sin censar</span>}
                              {rg.dictamen > 0 && <span className="chip morado">{rg.dictamen} dict.</span>}
                              {rg.repetidores > 0 && <span className="chip rojo">{rg.repetidores} rep.</span>}
                              {rg.pendientes > 0 && <span className="chip">{rg.pendientes} con pend.</span>}
                            </div>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </>
      )}
    </Marco>
  );
}
