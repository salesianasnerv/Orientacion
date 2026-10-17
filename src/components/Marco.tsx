import Link from "next/link";
import type { Perfil } from "@/lib/supabase/server";

const ROL = { orientacion: "Orientación", tutor: "Tutor/a", consulta: "Consulta" } as const;

type Pestana = "grupos" | "admin";

const Icono = {
  orientacion: <><circle cx="12" cy="8" r="4" /><path d="M4 21c1-4 4-6 8-6s7 2 8 6" /><path d="M17 3.5l1.5 1.5L21 2.5" /></>,
  persona: <><circle cx="12" cy="8" r="4" /><path d="M4 21c1-4 4-6 8-6s7 2 8 6" /></>,
  personas: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5M16 4.5a3.5 3.5 0 0 1 0 7M18 14.8c1.9.7 3.1 2.4 3.5 5.2" /></>,
  candado: <><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
  grupos: <><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M9 9v12M15 9v12" /></>,
  salir: <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H4" />,
  casa: <path d="M3 11l9-7 9 7M5 10v10h14V10" />,
};

export function Svg({ i }: { i: keyof typeof Icono }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true">{Icono[i]}</svg>;
}

// Presentación de la portada: qué es y qué puede hacer cada perfil (como en Horarios y Control de baños).
function Presentacion() {
  return (
    <section className="presenta">
      <div className="presenta-sup">
        <div className="cartel" role="navigation" aria-label="Estás en">
          <a href="https://claustro-utilidades.vercel.app/" title="Ir al portal de utilidades del profesorado"><Svg i="casa" />Utilidades</a>
          <span className="sep" aria-hidden="true">|</span>
          <a href="https://claustro-utilidades.vercel.app/#apEtapas" title="Ir al apartado «Por etapa» del portal">Por etapas</a>
        </div>
        <div className="etqs"><span className="etq">ESO</span></div>
      </div>
      <div className="presenta-cab">
        <span className="presenta-ico"><Svg i="orientacion" /></span>
        <div>
          <h1>Orientación</h1>
          <p>Ficha de cada alumno/a con seguimiento: NEAE, censo en Séneca, histórico y medidas de atención a la diversidad, por grupo y curso.</p>
        </div>
      </div>
      <div className="presenta-info">
        <details className="info-bloque">
          <summary><Svg i="personas" /><span>Profesorado <small>Acceso: Microsoft 365 (@salesianas.org)</small></span></summary>
          <ul>
            <li><b>Consulta:</b> grupos, alumnado en seguimiento y sus fichas.</li>
            <li><b>Histórico:</b> evolución de cada alumno/a desde Infantil y Primaria.</li>
          </ul>
        </details>
        <details className="info-bloque">
          <summary><Svg i="persona" /><span>Tutores/as <small>Acceso: Microsoft 365 · su grupo del curso actual</small></span></summary>
          <ul>
            <li><b>Edición:</b> fichas e histórico del alumnado de su grupo.</li>
            <li><b>Derivación:</b> añadir al seguimiento a un alumno/a de su clase.</li>
          </ul>
        </details>
        <details className="info-bloque">
          <summary><Svg i="candado" /><span>Orientación <em className="aviso-etq">Solo cuentas autorizadas</em> <small>Acceso: Microsoft 365 (@salesianas.org)</small></span></summary>
          <ul>
            <li><b>Edición completa:</b> todas las fichas, de cualquier curso.</li>
            <li><b>Administración:</b> perfiles, tutores, cursos y sincronización con Control de baños.</li>
          </ul>
        </details>
      </div>
    </section>
  );
}

export function Marco({
  perfil,
  curso,
  pestana,
  portada = false,
  migas,
  sinSesion = false,
  children,
}: {
  perfil: Perfil | null;
  curso?: string | null;
  pestana?: Pestana;
  portada?: boolean;
  migas?: React.ReactNode;
  sinSesion?: boolean;
  children: React.ReactNode;
}) {
  const esOrientacion = perfil?.rol === "orientacion";
  return (
    <>
      <header className="top solo-logo">
        <Link className="marca" href="/">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="logo" src="/logo.svg" alt="Salesianas Nervión" />
        </Link>
      </header>
      <div className="franja">
        <span className="quien">Orientación {curso && <>· Curso {curso}</>}</span>
        <div className="franja-acc">
          {esOrientacion && pestana !== "admin" && (
            <Link className="franja-btn" href="/admin"><Svg i="candado" />Administración</Link>
          )}
          {pestana === "admin" && <Link className="franja-btn" href="/"><Svg i="grupos" />Ver grupos</Link>}
        </div>
      </div>
      {perfil?.email && (
        <div className="sesion">
          <span className="sesion-nombre">
            <Svg i="persona" />
            {perfil.nombre ?? perfil.email}
            {perfil.rol && <span className="chip verde">{ROL[perfil.rol]}{perfil.rol === "tutor" && ` · ${perfil.grupos.join(", ")}`}</span>}
          </span>
          <form action="/auth/salir" method="post">
            <button className="sesion-salir"><Svg i="salir" />Salir</button>
          </form>
        </div>
      )}
      {portada && <Presentacion />}
      {perfil?.es_personal && (
        <nav className="menu" aria-label="Secciones">
          <Link href="/" className={pestana === "grupos" ? "activa" : ""}>Grupos</Link>
          {esOrientacion && <Link href="/admin" className={pestana === "admin" ? "activa" : ""}>Administración</Link>}
        </nav>
      )}
      <main>
        {migas && <p className="migas">{migas}</p>}
        {perfil?.es_personal || sinSesion ? children : (
          <div className="panel">
            <h2 className="naranja">Acceso no autorizado</h2>
            <p>La cuenta {perfil?.email ?? ""} no tiene acceso a la plataforma de Orientación. Si eres profesor/a del centro, contacta con el Departamento de Orientación.</p>
          </div>
        )}
      </main>
    </>
  );
}

export function Chip({ children, color }: { children: React.ReactNode; color?: "azul" | "verde" | "naranja" | "rojo" | "morado" }) {
  return <span className={`chip ${color ?? ""}`}>{children}</span>;
}
