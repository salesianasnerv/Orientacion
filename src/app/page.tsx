import Image from "next/image";
import { obtenerPerfil } from "@/lib/supabase/server";

const NOMBRE_ROL = {
  orientacion: "Orientación (edición completa)",
  tutor: "Tutor/a (edita su grupo)",
  consulta: "Consulta",
} as const;

export default async function Inicio() {
  const perfil = await obtenerPerfil();

  return (
    <main className="min-h-screen bg-fondo">
      <header className="flex items-center justify-between border-b border-borde bg-white px-4 py-3 sm:px-8">
        <Image src="/logo-horizontal.png" alt="Salesianas Nervión" width={600} height={216} className="h-10 w-auto" priority />
        <form action="/auth/salir" method="post">
          <button className="text-sm text-gris hover:text-azul">Cerrar sesión</button>
        </form>
      </header>

      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-8">
        {!perfil?.es_personal ? (
          <div className="rounded-lg border border-naranja/40 bg-white p-6">
            <h1 className="mb-2 text-lg font-semibold text-naranja">Acceso no autorizado</h1>
            <p className="text-sm">
              La cuenta {perfil?.email ?? ""} no tiene acceso a la plataforma de Orientación. Si eres profesor/a del
              centro, contacta con el Departamento de Orientación.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-borde bg-white p-6">
            <h1 className="mb-4 text-xl font-semibold">Hola{perfil.nombre ? `, ${perfil.nombre}` : ""}</h1>
            <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-sm">
              <dt className="text-gris">Cuenta</dt>
              <dd>{perfil.email}</dd>
              <dt className="text-gris">Perfil</dt>
              <dd>{perfil.rol ? NOMBRE_ROL[perfil.rol] : "—"}</dd>
              {perfil.grupos.length > 0 && (
                <>
                  <dt className="text-gris">Tutoría</dt>
                  <dd>{perfil.grupos.join(", ")}</dd>
                </>
              )}
            </dl>
            <p className="mt-6 text-sm text-gris">Fase 0 completada: el acceso funciona. Las fichas del alumnado llegan en la fase 1.</p>
          </div>
        )}
      </section>
    </main>
  );
}
