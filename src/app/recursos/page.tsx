import { ListaDocumentos } from "@/components/Documentos";
import { Marco } from "@/components/Marco";
import { RECURSOS } from "@/contenido/portal";
import { apartadosEnDirecto } from "@/lib/documentosEnDirecto";
import { obtenerPerfil } from "@/lib/supabase/server";

export default async function Recursos() {
  const [perfil, enDirecto] = await Promise.all([obtenerPerfil(), apartadosEnDirecto("Recursos", { general: "Recursos" })]);
  return (
    <Marco perfil={perfil} pestana="recursos" migas={<b>Recursos</b>}>
      <p className="sub">«Abrir» muestra el documento original en SharePoint.</p>
      <ListaDocumentos apartados={enDirecto ?? RECURSOS} />
    </Marco>
  );
}
