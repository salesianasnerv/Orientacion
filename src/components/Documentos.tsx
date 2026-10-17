import Link from "next/link";
import { urlSharePoint, type Apartado } from "@/contenido/portal";

const TIPO: Record<string, { etq: string; color: string }> = {
  pdf: { etq: "PDF", color: "rojo" },
  docx: { etq: "Word", color: "azul" },
  doc: { etq: "Word", color: "azul" },
  pptx: { etq: "PowerPoint", color: "naranja" },
};

// Lista de documentos por apartados: «Leer» dentro de la web (si hay versión en texto) y «Abrir» el original en SharePoint.
export function ListaDocumentos({ apartados }: { apartados: Apartado[] }) {
  return (
    <>
      {apartados.map((a) => (
        <section key={a.titulo} className="panel">
          <h2>{a.titulo}</h2>
          {a.descripcion && <p className="sub">{a.descripcion}</p>}
          <ul className="lista">
            {a.documentos.map((d) => {
              const ext = d.ruta.split(".").pop()?.toLowerCase() ?? "";
              const t = TIPO[ext];
              return (
                <li key={d.ruta}>
                  <span>
                    {d.slug ? <Link href={`/documento/${d.slug}`} style={{ fontWeight: 600 }}>{d.titulo}</Link> : <b>{d.titulo}</b>}
                    {d.nota && <span className="d"> · {d.nota}</span>}
                  </span>
                  <span className="chips" style={{ flexWrap: "nowrap" }}>
                    {t && <span className={`chip ${t.color}`}>{t.etq}</span>}
                    {d.slug && <Link className="btn mini pri" href={`/documento/${d.slug}`}>Leer</Link>}
                    <a className="btn mini" href={urlSharePoint(d.ruta)} target="_blank" rel="noopener noreferrer">Abrir ↗</a>
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </>
  );
}
