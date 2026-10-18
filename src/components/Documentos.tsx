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
              const versiones = d.versiones ?? [{ ext: d.ruta.split(".").pop()?.toLowerCase() ?? "", url: urlSharePoint(d.ruta) }];
              const t = versiones.length === 1 ? TIPO[versiones[0].ext] : undefined;
              return (
                <li key={d.ruta + d.titulo}>
                  <span>
                    {d.slug ? <Link href={`/documento/${d.slug}`} style={{ fontWeight: 600 }}>{d.titulo}</Link> : <b>{d.titulo}</b>}
                    {d.nota && <span className="d"> · {d.nota}</span>}
                  </span>
                  <span className="chips" style={{ flexWrap: "nowrap" }}>
                    {t && <span className={`chip ${t.color}`}>{t.etq}</span>}
                    {d.slug && <Link className="btn mini pri" href={`/documento/${d.slug}`}>Leer</Link>}
                    {versiones.map((v) => (
                      <a key={v.url} className="btn mini" href={v.url} target="_blank" rel="noopener noreferrer">
                        {versiones.length === 1 ? "Abrir" : (TIPO[v.ext]?.etq ?? v.ext.toUpperCase())} ↗
                      </a>
                    ))}
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
