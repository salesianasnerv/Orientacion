import Link from "next/link";
import { notFound } from "next/navigation";
import { crearFichaCurso } from "@/app/acciones";
import { Chip, Marco } from "@/components/Marco";
import { BLOQUES, GRUPOS_DE_BLOQUES, nombreCompleto, nombreGrupo, TIPOS_NEAE } from "@/lib/datos";
import { obtenerPerfil } from "@/lib/supabase/server";
import { cargarAlumno } from "./cargar";

export default async function PaginaAlumno({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ curso?: string }> }) {
  const [{ id }, { curso: cursoParam }] = await Promise.all([params, searchParams]);
  const perfil = await obtenerPerfil();
  if (!perfil?.es_personal) return <Marco perfil={perfil}>{null}</Marco>;

  const d = await cargarAlumno(id, cursoParam);
  if (!d) notFound();
  const { alumno, curso, cursosAlumno, ficha, matricula, grupo, historial, medidas } = d;

  return (
    <Marco
      perfil={perfil}
      curso={curso?.nombre}
      pestana="alumnado"
      migas={<>
        <Link href={`/?curso=${curso?.id ?? ""}`}>Alumnado</Link>
        {grupo && <> › <Link href={`/grupo/${grupo.id}`}>{nombreGrupo(grupo)}</Link></>} › <b>{nombreCompleto(alumno)}</b>
      </>}
    >
      <div className="cab-ficha">
        <div>
          <h1>{nombreCompleto(alumno)}</h1>
          <p className="muted" style={{ margin: 0 }}>
            {grupo ? `${nombreGrupo(grupo)} · Tutor/a: ${grupo.tutor?.nombre ?? "sin asignar"}` : "Sin grupo en este curso"}
            {matricula?.repetidor && " · Repetidor/a"}
          </p>
        </div>
        <div className="barra" style={{ margin: 0 }}>
          {cursosAlumno.length > 1 && cursosAlumno.map((c) => (
            <Link key={c.id} href={`/alumno/${id}?curso=${c.id}`} className={`btn mini ${c.id === curso?.id ? "pri" : ""}`}>{c.nombre}</Link>
          ))}
          {d.puedeEditar && ficha && <Link href={`/alumno/${id}/editar?curso=${curso?.id}`} className="btn pri">Editar ficha</Link>}
          {!d.puedeEditar && <Chip>Solo consulta</Chip>}
        </div>
      </div>

      <div className="cols">
        <div>
          {!ficha ? (
            <div className="aviso info">
              <p style={{ margin: "0 0 8px" }}>No hay ficha de Orientación para {curso?.nombre ?? "este curso"}.</p>
              {d.puedeCrearFicha && curso && (
                <form action={crearFichaCurso}>
                  <input type="hidden" name="alumno_id" value={id} />
                  <input type="hidden" name="curso_academico_id" value={curso.id} />
                  <button className="btn pri">Crear ficha de {curso.nombre} a partir de la anterior</button>
                </form>
              )}
            </div>
          ) : (
            <>
              <section className="panel">
                <h2 className="verde">NEAE</h2>
                <div className="chips" style={{ marginBottom: 10 }}>
                  {ficha.censado ? <Chip color="azul">Censado en Séneca</Chip> : <Chip color="naranja">Sin censar</Chip>}
                  {ficha.tipo_neae ? <Chip color="verde">{TIPOS_NEAE[ficha.tipo_neae] ?? ficha.tipo_neae}</Chip> : <Chip>Sin tipo de NEAE</Chip>}
                  {ficha.dictamen && <Chip color="morado">Dictamen de escolarización</Chip>}
                  {matricula?.materias_pendientes && <Chip color="rojo">Pendientes: {matricula.materias_pendientes}</Chip>}
                </div>
                <h3>Diagnóstico</h3>
                {ficha.diagnostico ? <p className="texto-largo">{ficha.diagnostico}</p> : <p className="muted">—</p>}
              </section>

              <section className="panel">
                <h2 className="naranja">Medidas {curso?.nombre}</h2>
                {medidas.length === 0 && <p className="muted">Ninguna medida marcada.</p>}
                {GRUPOS_DE_BLOQUES.map((g) => {
                  const delGrupo = medidas.filter((m) => g.bloques.includes(m.bloque));
                  if (!delGrupo.length) return null;
                  return (
                    <div key={g.titulo}>
                      <h3>{g.titulo}</h3>
                      {g.bloques.map((b) => {
                        const lista = delGrupo.filter((m) => m.bloque === b);
                        if (!lista.length) return null;
                        return (
                          <div key={b} className="bloque-medidas">
                            {g.bloques.length > 1 && <div className="muted small">{BLOQUES.find((x) => x.clave === b)?.titulo}</div>}
                            <ul className="lista-medidas">
                              {lista.map((m) => <li key={m.id}>{m.codigo && <b>{m.codigo} · </b>}{m.nombre}</li>)}
                            </ul>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
                {ficha.propuesta_medidas && (
                  <details className="notas">
                    <summary>Notas y concreción de las medidas</summary>
                    <p className="texto-largo">{ficha.propuesta_medidas}</p>
                  </details>
                )}
              </section>
            </>
          )}
        </div>

        <aside>
          <section className="panel">
            <h2>Expediente</h2>
            <div className="enlaces">
              {alumno.expediente_url ? (
                <a className="btn pri" href={alumno.expediente_url} target="_blank" rel="noopener noreferrer">Abrir expediente en SharePoint ↗</a>
              ) : (
                <p className="muted small" style={{ margin: 0 }}>Sin carpeta de expediente enlazada.</p>
              )}
              {alumno.carpeta_medidas_url && (
                <a className="btn" href={alumno.carpeta_medidas_url} target="_blank" rel="noopener noreferrer">Documentos de medidas 26-27 ↗</a>
              )}
              {!alumno.expediente_url && d.carpetaExpedientes && (
                <a className="btn" href={d.carpetaExpedientes} target="_blank" rel="noopener noreferrer">Carpeta general de expedientes ↗</a>
              )}
            </div>
          </section>

          <section className="panel">
            <h2>Histórico</h2>
            {historial.length === 0 ? (
              <p className="vacio">Sin entradas.</p>
            ) : (
              <div className="historial">
                {historial.map((h, i) => (
                  <details key={h.id} open={i === 0}>
                    <summary>{h.etiqueta}</summary>
                    <p className="texto-largo">{h.texto}</p>
                  </details>
                ))}
              </div>
            )}
          </section>
        </aside>
      </div>
    </Marco>
  );
}
