import Link from "next/link";
import { DOCS, IMPORTANTE, NUEVOS, SEGUIMIENTO, type ClaveDoc, type Paso } from "@/contenido/derivacion";
import { urlSharePoint } from "@/contenido/portal";

const ETIQUETA: Record<string, { etq: string; color: string }> = {
  pdf: { etq: "PDF", color: "rojo" },
  docx: { etq: "Word", color: "azul" },
  doc: { etq: "Word", color: "azul" },
};

// **negrita** dentro de los textos del proceso
function Texto({ t }: { t: string }) {
  return <>{t.split(/(\*\*[^*]+\*\*)/).map((p, i) => (p.startsWith("**") ? <strong key={i}>{p.slice(2, -2)}</strong> : p))}</>;
}

type Enlaces = Partial<Record<ClaveDoc, string>>;

function BotonDoc({ clave, enlaces }: { clave: ClaveDoc; enlaces: Enlaces }) {
  const d = DOCS[clave];
  const t = ETIQUETA[d.ruta.split(".").pop() ?? ""];
  return (
    <span className="doc-paso">
      <a href={enlaces[clave] ?? urlSharePoint(d.ruta)} target="_blank" rel="noopener noreferrer" title="Abrir en SharePoint">
        {d.num && <b className="doc-num">{d.num}</b>}
        {d.titulo}
        {t && <span className={`chip ${t.color}`}>{t.etq}</span>}
        <span aria-hidden>↗</span>
      </a>
      {"slug" in d && <Link href={`/documento/${d.slug}`} className="leer">Leer</Link>}
    </span>
  );
}

// Infografía: los pasos en fila (en columna en el móvil); cada uno lleva a su explicación
function Infografia({ pasos, id, titulo, color }: { pasos: Paso[]; id: string; titulo: string; color: "azul" | "verde" }) {
  return (
    <div className={`ruta ruta-${color}`}>
      <div className="ruta-titulo">{titulo}</div>
      <ol className="ruta-pasos">
        {pasos.map((p) => (
          <li key={p.n}>
            <a href={`#${id}-${p.n}`}>
              <span className="ruta-num">{p.n}</span>
              <span className="ruta-corto">{p.corto}</span>
              <span className="ruta-quien">{p.quien}</span>
              {p.docs.length > 0 && <span className="ruta-docs">Doc. {p.docs.map((c) => DOCS[c].num).join(" · ")}</span>}
            </a>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Pasos({ pasos, id, color, enlaces }: { pasos: Paso[]; id: string; color: "azul" | "verde"; enlaces: Enlaces }) {
  return (
    <div className="pasos">
      {pasos.map((p) => (
        <article key={p.n} id={`${id}-${p.n}`} className={`paso paso-${color}`}>
          <div className="paso-num">{p.n}º</div>
          <div className="paso-cuerpo">
            <h3>{p.titulo}</h3>
            <div className="paso-quien">{p.quien}</div>
            {p.parrafos.map((t, i) => <p key={i}><Texto t={t} /></p>)}
            {p.notas?.map((t, i) => <div key={i} className="paso-nota"><Texto t={t} /></div>)}
            {p.docs.length > 0 && (
              <div className="paso-docs">
                {[...new Set(p.docs)].map((c) => <BotonDoc key={c} clave={c} enlaces={enlaces} />)}
              </div>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}

export function ContenidoDerivacion({ enlaces = {} }: { enlaces?: Enlaces }) {
  const todos = (Object.keys(DOCS) as ClaveDoc[]).filter((c) => c !== "pasos");
  return (
    <>
      <section className="panel">
        <h2>Proceso de derivación y seguimiento del alumnado</h2>
        <p className="sub" style={{ marginBottom: 14 }}>
          Dos caminos: el <b>alumnado nuevo</b> que empieza a recibir medidas y el <b>alumnado ya derivado</b> que aparece en la tabla de seguimiento.
          Pulsa un paso para ver qué hay que hacer y sus documentos.
        </p>
        <Infografia pasos={NUEVOS} id="nuevo" titulo="Derivación de alumnado nuevo" color="azul" />
        <Infografia pasos={SEGUIMIENTO} id="seguimiento" titulo="Seguimiento del alumnado derivado" color="verde" />
        <div className="aviso info" style={{ marginTop: 14 }}>
          En la web: para añadir un alumno/a al seguimiento entra en <Link href="/grupos">Grupos</Link>, abre su clase y pulsa «+ Añadir al seguimiento».
          Desde su ficha puedes <b>generar el documento de seguimiento</b> (Word o PDF) ya relleno.
        </div>
      </section>

      <section className="panel">
        <h2 className="azul">Derivación de alumnado nuevo</h2>
        <Pasos pasos={NUEVOS} id="nuevo" color="azul" enlaces={enlaces} />
      </section>

      <section className="panel">
        <h2 className="verde">Seguimiento del alumnado derivado <span className="muted small" style={{ fontWeight: 400 }}>(los que aparecen en la tabla)</span></h2>
        <Pasos pasos={SEGUIMIENTO} id="seguimiento" color="verde" enlaces={enlaces} />
      </section>

      <section className="panel importante">
        <h2 className="naranja">Aspectos importantes</h2>
        <ul>{IMPORTANTE.map((t, i) => <li key={i}><Texto t={t} /></li>)}</ul>
      </section>

      <section className="panel">
        <h2>Todos los documentos del proceso</h2>
        <div className="paso-docs">
          {todos.map((c) => <BotonDoc key={c} clave={c} enlaces={enlaces} />)}
        </div>
        <p className="muted small" style={{ marginBottom: 0 }}>
          Documento original con los pasos: <a href={enlaces.pasos ?? urlSharePoint(DOCS.pasos.ruta)} target="_blank" rel="noopener noreferrer">{DOCS.pasos.titulo} ↗</a>
        </p>
      </section>
    </>
  );
}
