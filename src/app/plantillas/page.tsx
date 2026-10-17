import { ListaDocumentos } from "@/components/Documentos";
import { Marco } from "@/components/Marco";
import { PLANTILLAS } from "@/contenido/portal";
import { obtenerPerfil } from "@/lib/supabase/server";

export default async function Plantillas() {
  const perfil = await obtenerPerfil();
  return (
    <Marco perfil={perfil} pestana="plantillas" migas={<b>Plantillas y autorizaciones</b>}>
      <ListaDocumentos apartados={PLANTILLAS} />
    </Marco>
  );
}
