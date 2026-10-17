import { ListaDocumentos } from "@/components/Documentos";
import { Marco } from "@/components/Marco";
import { RECURSOS } from "@/contenido/portal";
import { obtenerPerfil } from "@/lib/supabase/server";

export default async function Recursos() {
  const perfil = await obtenerPerfil();
  return (
    <Marco perfil={perfil} pestana="recursos" migas={<b>Recursos</b>}>
      <p className="sub">«Leer» abre el texto dentro del portal; «Abrir» muestra el documento original en SharePoint.</p>
      <ListaDocumentos apartados={RECURSOS} />
    </Marco>
  );
}
