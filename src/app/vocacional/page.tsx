import { Marco } from "@/components/Marco";
import { obtenerPerfil } from "@/lib/supabase/server";

export default async function OrientacionVocacional() {
  const perfil = await obtenerPerfil();
  return (
    <Marco perfil={perfil} pestana="vocacional" migas={<b>Plan de Orientación Académica, Profesional y Vocacional</b>}>
      <section className="panel">
        <h2 className="verde">Plan de Orientación Académica, Profesional y Vocacional</h2>
        <p className="vacio">Sección en preparación. Aquí irán los materiales de orientación académica y profesional (itinerarios, optativas, salidas, POAP…).</p>
      </section>
    </Marco>
  );
}
