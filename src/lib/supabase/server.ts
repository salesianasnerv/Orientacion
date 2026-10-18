import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { opcionesCookies } from "./cookies";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: opcionesCookies,
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Llamado desde un Server Component: el middleware ya refresca la sesión.
          }
        },
      },
    },
  );
}

export type Perfil = {
  email: string | null;
  es_personal: boolean;
  nombre: string | null;
  rol: "orientacion" | "tutor" | "consulta" | null;
  grupos: string[];
};

export async function obtenerPerfil(): Promise<Perfil | null> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("mi_perfil");
  return (data as Perfil | null) ?? null;
}
