import type { ApartadoMedidas, DatosFicha } from "./datos";

const Texto = ({ t }: { t: string | null }) =>
  t?.trim() ? <>{t.trim().split(/\n+/).map((x, i) => <p key={i} className="justif">{x}</p>)}</> : <p className="gris">—</p>;

function Medidas({ apartados }: { apartados: ApartadoMedidas[] }) {
  if (!apartados.length) return <p className="gris">Ninguna medida marcada.</p>;
  return apartados.map((a) => (
    <div key={a.titulo} className="bloque">
      <h3>{a.titulo}</h3>
      <ul>{a.items.map((m) => <li key={m}>{m}</li>)}</ul>
    </div>
  ));
}

// Hoja A4 de la ficha con la cabecera y el pie de la hoja corporativa vertical
export function HojaFicha({ d }: { d: DatosFicha }) {
  const hoy = new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Madrid" });
  return (
    <div className="hoja">
      <table className="hoja-tabla">
        <thead>
          <tr><td>
            <div className="hoja-cab">
              <span className="lema">La alegría de crecer juntos</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/corporativo/logo-hoja.png" alt="Salesianas Nervión" />
            </div>
          </td></tr>
        </thead>
        <tfoot><tr><td><div className="hueco-pie" /></td></tr></tfoot>
        <tbody>
          <tr><td className="hoja-cuerpo">
            <h1>Ficha de orientación del alumno/a</h1>
            <p className="subt">Atención a la diversidad · Curso {d.curso}</p>

            <h2>Datos del alumno/a</h2>
            <table className="t-datos">
              <tbody>
                <tr><th>Alumno/a</th><td><b>{d.alumno}</b></td><th>Grupo</th><td>{d.grupo}</td></tr>
                <tr><th>Tutor/a</th><td>{d.tutor}</td><th>Repetidor/a</th><td>{d.repetidor ? <b className="naranja">Sí</b> : "No"}</td></tr>
                <tr>
                  <th>Séneca</th><td>{d.censado ? <b className="azul">Censado/a</b> : <b className="naranja">Sin censar</b>}</td>
                  <th>Tipo de NEAE</th><td>{d.tipoNeae ?? <span className="gris">—</span>}</td>
                </tr>
                <tr>
                  <th>Dictamen</th><td>{d.dictamen ? "Sí" : "No"}</td>
                  <th>Pendientes</th><td>{d.pendientes.length || d.pendientesTexto || "Ninguna"}</td>
                </tr>
              </tbody>
            </table>

            <h2>Diagnóstico</h2>
            <Texto t={d.diagnostico} />

            {d.pendientes.length > 0 && (
              <>
                <h2>Materias pendientes</h2>
                <table className="t-azul">
                  <thead><tr><th style={{ width: "15%" }}>Curso</th><th style={{ width: "45%" }}>Materia</th><th>Seguimiento (programa de refuerzo)</th></tr></thead>
                  <tbody>{d.pendientes.map((p, i) => <tr key={i}><td>{p.nivel}</td><td>{p.materia}</td><td>{p.profesor ?? <span className="gris">Sin asignar</span>}</td></tr>)}</tbody>
                </table>
              </>
            )}

            <h2 className="h-azul">Medidas generales · {d.curso}</h2>
            <Medidas apartados={d.generales} />
            <h2 className="h-naranja">Medidas específicas y programas · {d.curso}</h2>
            <Medidas apartados={d.especificas} />

            <h2>Aspectos a tener en cuenta</h2>
            <Texto t={d.aspectos} />

            <h2>Evaluación de las medidas</h2>
            <table className="t-azul">
              <thead><tr><th>1ª Evaluación</th><th>2ª Evaluación</th><th>Evaluación ordinaria</th></tr></thead>
              <tbody><tr>{d.evaluaciones.map((e, i) => <td key={i} style={{ width: "33.3%" }}>{e?.trim() || <span className="gris">—</span>}</td>)}</tr></tbody>
            </table>

            {d.historial.length > 0 && (
              <>
                <h2>Histórico</h2>
                {d.historial.map((h, i) => <div key={i} className="bloque"><h3>{h.etiqueta}</h3><Texto t={h.texto} /></div>)}
              </>
            )}

            <p className="nota">Documento generado el {hoy} desde el Portal de Orientación. Contiene datos personales: uso confidencial y exclusivo del equipo docente.</p>
          </td></tr>
        </tbody>
      </table>

      <div className="hoja-pie">
        <p><span className="v">SALESIANAS NERVIÓN</span><span className="punto">•</span><span className="a">Escuelas Salesianas María Auxiliadora</span></p>
        <p className="peq">C/ SANTA MARÍA MAZZARELLO, 1<span className="punto">•</span>41005 SEVILLA<span className="punto">•</span>954 63 23 47<span className="punto">•</span>www.nervion.salesianas.org</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/corporativo/franja-pie.png" alt="" />
      </div>
    </div>
  );
}
