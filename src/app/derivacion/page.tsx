import Link from "next/link";
import { ListaDocumentos } from "@/components/Documentos";
import { Marco } from "@/components/Marco";
import { DERIVACION } from "@/contenido/portal";
import { obtenerPerfil } from "@/lib/supabase/server";

export default async function Derivacion() {
  const perfil = await obtenerPerfil();
  return (
    <Marco perfil={perfil} pestana="derivacion" migas={<>Atención a la diversidad › <b>Proceso de derivación y medidas</b></>}>
      <div className="aviso info">
        Para derivar a un alumno/a nuevo: en <Link href="/grupos">Grupos</Link>, entra en su clase y pulsa «+ Añadir al seguimiento». Las autorizaciones y
        actas están en <Link href="/plantillas">Plantillas</Link>.
      </div>
      <ListaDocumentos apartados={DERIVACION} />
    </Marco>
  );
}
