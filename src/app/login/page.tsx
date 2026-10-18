import { Marco } from "@/components/Marco";
import { BotonMicrosoft } from "./BotonMicrosoft";
import { EntrarDesdeTeams } from "./EntrarDesdeTeams";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;

  return (
    <Marco perfil={null} portada sinSesion>
      <section className="login" style={{ minHeight: 0, padding: "28px 0" }}>
        <div className="tarjeta">
          <h1>Iniciar sesión</h1>
          <p>Pulsa el botón y entra con tu cuenta del colegio <strong>@salesianas.org</strong>.</p>
          <EntrarDesdeTeams />
          <BotonMicrosoft />
          <p className="error">{error && "No se ha podido iniciar sesión. Inténtalo de nuevo o avisa a Orientación."}</p>
        </div>
      </section>
    </Marco>
  );
}
