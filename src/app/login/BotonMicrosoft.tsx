"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function BotonMicrosoft() {
  const [cargando, setCargando] = useState(false);

  async function entrar() {
    setCargando(true);
    await createClient().auth.signInWithOAuth({
      provider: "azure",
      options: {
        scopes: "openid profile email offline_access",
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  return (
    <button
      onClick={entrar}
      disabled={cargando}
      className="flex w-full items-center justify-center gap-3 rounded-md bg-azul px-4 py-3 font-medium text-white hover:bg-azul-oscuro disabled:opacity-60"
    >
      <svg width="18" height="18" viewBox="0 0 21 21" aria-hidden>
        <rect x="1" y="1" width="9" height="9" fill="#f25022" />
        <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
        <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
        <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
      </svg>
      {cargando ? "Redirigiendo…" : "Entrar con Microsoft 365"}
    </button>
  );
}
