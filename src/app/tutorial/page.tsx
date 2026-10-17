import { ListaDocumentos } from "@/components/Documentos";
import { Marco } from "@/components/Marco";
import { TUTORIAL } from "@/contenido/portal";
import { obtenerPerfil } from "@/lib/supabase/server";

export default async function AccionTutorial() {
  const perfil = await obtenerPerfil();
  return (
    <Marco perfil={perfil} pestana="tutorial" migas={<b>Plan de Acción Tutorial</b>}>
      <ListaDocumentos apartados={TUTORIAL} />
    </Marco>
  );
}
