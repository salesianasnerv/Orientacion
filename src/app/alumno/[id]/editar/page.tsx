import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { borrarEntradaHistorial, guardarEntradaHistorial, guardarFicha } from "@/app/acciones";
import { Marco } from "@/components/Marco";
import { BLOQUES, GRUPOS_DE_BLOQUES, nombreCompleto, nombreGrupo, TIPOS_NEAE } from "@/lib/datos";
import { obtenerPerfil } from "@/lib/supabase/server";
import { cargarAlumno } from "../cargar";

export default async function EditarAlumno({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ curso?: string }> }) {
  const [{ id }, { curso: cursoParam }] = await Promise.all([params, searchParams]);
  const perfil = await obtenerPerfil();
  if (!perfil?.es_personal) return <Marco perfil={perfil}>{null}</Marco>;

  const d = await cargarAlumno(id, cursoParam);
  if (!d) notFound();
  const { alumno, curso, ficha, grupo, historial, catalogo, idsMarcadas } = d;
  if (!ficha || !d.puedeEditar) redirect(`/alumno/${id}?curso=${curso?.id ?? ""}`);
  const volver = `/alumno/${id}?curso=${curso?.id}`;
  const etiquetaCurso = `Curso ${curso?.nombre ?? ""}${grupo ? ` (${grupo.nivel?.nombre ?? ""})` : ""}`;

  return (
    <Marco
      perfil={perfil}
      curso={curso?.nombre}
      pestana="alumnado"
      migas={<>
        {grupo && <><Link href={`/grupo/${grupo.id}`}>{nombreGrupo(grupo)}</Link> › </>}
        <Link href={volver}>{nombreCompleto(alumno)}</Link> › <b>Editar</b>
      </>}
    >
      <form action={guardarFicha} className="form-ficha">
        <input type="hidden" name="ficha_id" value={ficha.id} />
        <input type="hidden" name="alumno_id" value={id} />

        <section className="panel form-ficha">
          <h2 className="verde">NEAE · {curso?.nombre}</h2>
          <div className="form-grid">
            <label className="campo">
              Tipo de NEAE
              <select name="tipo_neae" defaultValue={ficha.tipo_neae ?? ""}>
                <option value="">— Sin NEAE / pendiente —</option>
                {Object.entries(TIPOS_NEAE).map(([k, v]) => <option key={k} value={k}>{k} · {v}</option>)}
              </select>
            </label>
            <div className="casillas" style={{ alignItems: "flex-end" }}>
              <label><input type="checkbox" name="censado" defaultChecked={ficha.censado} /> Censado en Séneca</label>
              <label><input type="checkbox" name="dictamen" defaultChecked={ficha.dictamen} /> Dictamen</label>
            </div>
          </div>
          <label className="campo">
            Diagnóstico
            <textarea name="diagnostico" defaultValue={ficha.diagnostico ?? ""} rows={3} />
          </label>
        </section>

        <section className="panel">
          <h2 className="naranja">Medidas · {curso?.nombre}</h2>
          <p className="sub">Marca las medidas que se aplican este curso.</p>
          {GRUPOS_DE_BLOQUES.map((g) => (
            <details key={g.titulo} className="grupo-medidas" open>
              <summary>{g.titulo}</summary>
              <div>
                {g.bloques.map((b) => (
                  <div key={b}>
                    {g.bloques.length > 1 && <h3>{BLOQUES.find((x) => x.clave === b)?.titulo}</h3>}
                    <div className="casillas-medidas">
                      {catalogo.filter((m) => m.bloque === b).map((m) => (
                        <label key={m.id} title={m.descripcion ?? undefined}>
                          <input type="checkbox" name="medida" value={m.id} defaultChecked={idsMarcadas.has(m.id)} />
                          <span>{m.codigo && <b>{m.codigo} · </b>}{m.nombre}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </details>
          ))}
          <label className="campo">
            Notas y concreción de las medidas
            <textarea name="propuesta_medidas" defaultValue={ficha.propuesta_medidas ?? ""} rows={4} placeholder="Áreas, condiciones, «Otros»…" />
          </label>
        </section>

        {d.puedeEditarAlumno && (
          <section className="panel">
            <h2>Expediente (enlaces de SharePoint)</h2>
            <div className="form-grid">
              <label className="campo">Carpeta del expediente<input type="text" name="expediente_url" defaultValue={alumno.expediente_url ?? ""} placeholder="https://salesianas.sharepoint.com/…" /></label>
              <label className="campo">Carpeta de medidas del curso<input type="text" name="carpeta_medidas_url" defaultValue={alumno.carpeta_medidas_url ?? ""} placeholder="https://salesianas.sharepoint.com/…" /></label>
            </div>
          </section>
        )}

        <div className="fila-botones">
          <Link href={volver} className="btn">Cancelar</Link>
          <button className="btn pri">Guardar ficha</button>
        </div>
      </form>

      <section className="panel form-ficha" style={{ marginTop: 14 }}>
        <h2>Histórico</h2>
        <form action={guardarEntradaHistorial} className="entrada-hist">
          <input type="hidden" name="alumno_id" value={id} />
          <strong>Nueva entrada (observaciones del curso, acuerdos, evolución…)</strong>
          <input type="text" name="etiqueta" defaultValue={etiquetaCurso} required />
          <textarea name="texto" required />
          <div className="fila-botones"><button className="btn mini pri">Añadir al histórico</button></div>
        </form>
        <div className="historial">
          {historial.map((h, i) => (
            <details key={h.id} open={i === 0}>
              <summary>{h.etiqueta}</summary>
              <div style={{ padding: "0 12px 12px" }}>
                <form action={guardarEntradaHistorial} className="form-ficha" style={{ gap: 8 }}>
                  <input type="hidden" name="id" value={h.id} />
                  <input type="hidden" name="alumno_id" value={id} />
                  <input type="text" name="etiqueta" defaultValue={h.etiqueta} aria-label="Curso o etapa" />
                  <textarea name="texto" defaultValue={h.texto} aria-label="Texto" rows={5} />
                  <div className="fila-botones"><button className="btn mini">Guardar entrada</button></div>
                </form>
                <form action={borrarEntradaHistorial} className="fila-botones" style={{ marginTop: 6 }}>
                  <input type="hidden" name="id" value={h.id} />
                  <input type="hidden" name="alumno_id" value={id} />
                  <button className="btn mini peligro">Borrar entrada</button>
                </form>
              </div>
            </details>
          ))}
        </div>
      </section>
    </Marco>
  );
}
