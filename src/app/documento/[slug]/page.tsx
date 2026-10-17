import { marked } from "marked";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Marco, type Pestana } from "@/components/Marco";
import { DOCUMENTOS } from "@/contenido/documentos";
import { DERIVACION, RECURSOS, TODOS, urlSharePoint } from "@/contenido/portal";
import { obtenerPerfil } from "@/lib/supabase/server";

export default async function Documento({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const doc = TODOS.find((d) => d.slug === slug);
  const md = DOCUMENTOS[slug];
  if (!doc || !md) notFound();
  const [perfil, html] = await Promise.all([obtenerPerfil(), marked.parse(md)]);

  const enDerivacion = DERIVACION.some((a) => a.documentos.includes(doc));
  const pestana: Pestana = enDerivacion ? "derivacion" : RECURSOS.some((a) => a.documentos.includes(doc)) ? "recursos" : "plantillas";
  const volver = enDerivacion ? { href: "/derivacion", t: "Proceso de derivación y medidas" } : { href: "/recursos", t: "Recursos" };

  return (
    <Marco perfil={perfil} pestana={pestana} migas={<><Link href={volver.href}>{volver.t}</Link> › <b>{doc.titulo}</b></>}>
      <section className="panel">
        <div className="barra">
          <h2 style={{ margin: 0 }}>{doc.titulo}</h2>
          <span className="sep" />
          <a className="btn mini" href={urlSharePoint(doc.ruta)} target="_blank" rel="noopener noreferrer">Original en SharePoint ↗</a>
        </div>
        <p className="muted small">Texto extraído del documento original para leerlo aquí; las imágenes y el formato están en el original.</p>
        <article className="documento" dangerouslySetInnerHTML={{ __html: html }} />
      </section>
    </Marco>
  );
}
