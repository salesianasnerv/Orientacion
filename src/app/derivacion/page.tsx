import { ContenidoDerivacion } from "@/components/Derivacion";
import { Marco } from "@/components/Marco";
import { DOCS, type ClaveDoc } from "@/contenido/derivacion";
import { listarCarpeta } from "@/lib/sharepoint";
import { obtenerPerfil } from "@/lib/supabase/server";

// Enlaces en directo a los documentos del proceso: se reconocen por su número («2. …», «1.1. …») aunque cambie el resto del nombre
async function enlacesEnDirecto() {
  const c = await listarCarpeta("Proceso Derivación Secundaria");
  if (!c) return {};
  const enlaces: Partial<Record<ClaveDoc, string>> = {};
  for (const [clave, d] of Object.entries(DOCS) as [ClaveDoc, (typeof DOCS)[ClaveDoc]][]) {
    const f = c.archivos.find((a) => (d.num ? a.nombre.startsWith(`${d.num}. `) : /^pasos/i.test(a.nombre)));
    if (f) enlaces[clave] = f.url;
  }
  return enlaces;
}

export default async function Derivacion() {
  const [perfil, enlaces] = await Promise.all([obtenerPerfil(), enlacesEnDirecto()]);
  return (
    <Marco perfil={perfil} pestana="derivacion" migas={<>Atención a la diversidad › <b>Proceso de derivación y seguimiento</b></>}>
      <ContenidoDerivacion enlaces={enlaces} />
    </Marco>
  );
}
