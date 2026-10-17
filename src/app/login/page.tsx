import Image from "next/image";
import { BotonMicrosoft } from "./BotonMicrosoft";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-fondo px-4">
      <div className="w-full max-w-sm rounded-lg border border-borde bg-white p-8 shadow-sm">
        <Image src="/logo-horizontal.png" alt="Salesianas Nervión" width={600} height={216} className="mx-auto mb-6 h-auto w-56" priority />
        <h1 className="mb-1 text-center text-xl font-semibold">Orientación</h1>
        <p className="mb-6 text-center text-sm text-gris">Accede con tu cuenta del colegio</p>
        {error && (
          <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
            No se ha podido iniciar sesión. Inténtalo de nuevo o avisa a Orientación.
          </p>
        )}
        <BotonMicrosoft />
      </div>
    </main>
  );
}
