import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { borrarEntradaHistorial, guardarEntradaHistorial, guardarFicha } from "@/app/acciones";
import { Marco } from "@/components/Marco";
import { nombreCompleto, nombreGrupo, TIPOS_NEAE } from "@/lib/datos";
import { obtenerPerfil } from "@/lib/supabase/server";
import { cargarAlumno } from "../cargar";

function Area({ nombre, etiqueta, valor, filas = 4 }: { nombre: string; etiqueta: string; valor: string | null; filas?: number }) {
  return (
    <label className="campo">
      {etiqueta}
      <textarea name={nombre} defaultValue={valor ?? ""} rows={filas} />
    </label>
  );
}

export default async function EditarAlumno({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ curso?: string }> }) {
  const [{ id }, { curso: cursoParam }] = await Promise.all([params, searchParams]);
  const perfil = await obtenerPerfil();
  if (!perfil?.es_personal) return <Marco perfil={perfil}>{null}</Marco>;

  const d = await cargarAlumno(id, cursoParam);
  if (!d) notFound();
  const { alumno, curso, ficha, matricula, historial } = d;
  if (!ficha || !d.puedeEditar) redirect(`/alumno/${id}?curso=${curso?.id ?? ""}`);
  const grupo = matricula?.grupo;
  const volver = `/alumno/${id}?curso=${curso?.id}`;

  return (
    <Marco
      perfil={perfil}
      curso={curso?.nombre}
      pestana="grupos"
      migas={<>
        {grupo && <><Link href={`/grupo/${grupo.id}`}>{nombreGrupo(grupo)}</Link> › </>}
        <Link href={volver}>{nombreCompleto(alumno)}</Link> › <b>Editar</b>
      </>}
    >
      <form action={guardarFicha} className="panel form-ficha">
        <h2 className="verde">Ficha {curso?.nombre}</h2>
        <input type="hidden" name="ficha_id" value={ficha.id} />
        <input type="hidden" name="alumno_id" value={id} />
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
        <Area nombre="diagnostico" etiqueta="Diagnóstico / NEAE" valor={ficha.diagnostico} filas={3} />
        <Area nombre="atencion_recibida" etiqueta="Atención recibida" valor={ficha.atencion_recibida} filas={3} />
        <Area nombre="observaciones" etiqueta={`Observaciones del curso ${curso?.nombre ?? ""}`} valor={ficha.observaciones} filas={6} />
        <Area nombre="propuesta_medidas" etiqueta="Propuesta de medidas" valor={ficha.propuesta_medidas} filas={10} />
        <label className="campo">
          Materias
          <input type="text" name="materias" defaultValue={ficha.materias ?? ""} />
        </label>
        <div className="fila-botones">
          <Link href={volver} className="btn">Cancelar</Link>
          <button className="btn pri">Guardar ficha</button>
        </div>
      </form>

      <section className="panel form-ficha">
        <h2>Histórico</h2>
        <p className="sub">Cada entrada se guarda por separado.</p>
        {historial.map((h) => (
          <div key={h.id} className="entrada-hist">
            <form action={guardarEntradaHistorial} className="form-ficha" style={{ gap: 8 }}>
              <input type="hidden" name="id" value={h.id} />
              <input type="hidden" name="alumno_id" value={id} />
              <input type="text" name="etiqueta" defaultValue={h.etiqueta} aria-label="Curso o etapa" />
              <textarea name="texto" defaultValue={h.texto} aria-label="Texto" />
              <div className="fila-botones">
                <button className="btn mini">Guardar entrada</button>
              </div>
            </form>
            <form action={borrarEntradaHistorial} className="fila-botones">
              <input type="hidden" name="id" value={h.id} />
              <input type="hidden" name="alumno_id" value={id} />
              <button className="btn mini peligro">Borrar</button>
            </form>
          </div>
        ))}
        <form action={guardarEntradaHistorial} className="entrada-hist">
          <input type="hidden" name="alumno_id" value={id} />
          <strong>Nueva entrada</strong>
          <input type="text" name="etiqueta" placeholder="p. ej. Curso 2026-27 (1º ESO)" required />
          <textarea name="texto" placeholder="Evolución, medidas, acuerdos…" required />
          <div className="fila-botones"><button className="btn mini pri">Añadir al histórico</button></div>
        </form>
      </section>
    </Marco>
  );
}
