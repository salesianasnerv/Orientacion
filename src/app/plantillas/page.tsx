import { ListaDocumentos } from "@/components/Documentos";
import { Marco } from "@/components/Marco";
import { PLANTILLAS } from "@/contenido/portal";
import { apartadosEnDirecto } from "@/lib/documentosEnDirecto";
import { obtenerPerfil } from "@/lib/supabase/server";

// Carpetas de «Plantillas» en SharePoint → título del apartado en la web (y su orden)
const TITULOS: [string, string][] = [
  ["Atención a la Diversidad", "Registro y seguimiento de medidas"],
  ["Proceso de derivación", "Derivación"],
  ["Autorizaciones", "Autorizaciones"],
];

export default async function Plantillas() {
  const [perfil, enDirecto] = await Promise.all([obtenerPerfil(), apartadosEnDirecto("Plantillas", { general: "Plantillas", titulos: TITULOS })]);
  return (
    <Marco perfil={perfil} pestana="plantillas" migas={<b>Plantillas y autorizaciones</b>}>
      <ListaDocumentos apartados={enDirecto ?? PLANTILLAS} />
    </Marco>
  );
}
