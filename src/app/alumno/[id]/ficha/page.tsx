import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Marco } from "@/components/Marco";
import { obtenerPerfil } from "@/lib/supabase/server";
import { BotonImprimir } from "./BotonImprimir";
import { datosFicha } from "./datos";
import { HojaFicha } from "./HojaFicha";
import "./ficha.css";

export const metadata: Metadata = { title: "Ficha de orientación" };

// Versión para imprimir / guardar como PDF de la ficha, con la cabecera y el pie de la hoja corporativa
export default async function FichaImprimible({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ curso?: string }> }) {
  const [{ id }, { curso }] = await Promise.all([params, searchParams]);
  const perfil = await obtenerPerfil();
  if (!perfil?.es_personal) return <Marco perfil={perfil}>{null}</Marco>;

  const r = await datosFicha(id, curso);
  if (!r) notFound();
  const q = r.cursoId ? `?curso=${r.cursoId}` : "";

  return (
    <div className="ficha-imp">
      <div className="ficha-barra no-imprimir">
        <Link href={`/alumno/${id}${q}`} className="btn">← Volver a la ficha</Link>
        <BotonImprimir />
        <a href={`/alumno/${id}/ficha/docx${q}`} className="btn">Descargar Word</a>
        <span className="muted small">En la ventana de imprimir, elige <b>Guardar como PDF</b> como destino.</span>
      </div>

      <HojaFicha d={r.datos} />
    </div>
  );
}
