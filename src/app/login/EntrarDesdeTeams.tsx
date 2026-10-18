"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// La app de Teams abre la web con «?teams=1». En ese caso se entra sola con la cuenta
// con la que se ha abierto Teams, sin pulsar «Entrar con Microsoft 365».
// Necesita la API expuesta en la app «Acceso a Microsoft 365» de Entra ID; si falla, queda el botón de siempre.
const SDK = "https://cdn.jsdelivr.net/npm/@microsoft/teams-js@2.57.0/dist/umd/MicrosoftTeams.min.js";
const CLAVE = "abierta-en-teams";

type Teams = {
  app: { initialize(): Promise<void> };
  authentication: { getAuthToken(): Promise<string> };
};

function cargarSdk(): Promise<Teams> {
  const w = window as unknown as { microsoftTeams?: Teams };
  if (w.microsoftTeams) return Promise.resolve(w.microsoftTeams);
  return new Promise((ok, mal) => {
    const s = document.createElement("script");
    s.src = SDK;
    s.onload = () => (w.microsoftTeams ? ok(w.microsoftTeams) : mal(new Error("Teams no disponible")));
    s.onerror = () => mal(new Error("No se pudo cargar Teams"));
    document.head.appendChild(s);
  });
}

const conLimite = <T,>(p: Promise<T>, ms: number) =>
  Promise.race([p, new Promise<never>((_, mal) => setTimeout(() => mal(new Error("Teams no responde")), ms))]);

export function EntrarDesdeTeams() {
  const [entrando, setEntrando] = useState(false);

  useEffect(() => {
    let enTeams = false;
    try {
      if (new URLSearchParams(location.search).has("teams")) sessionStorage.setItem(CLAVE, "1");
      enTeams = sessionStorage.getItem(CLAVE) === "1";
    } catch {
      enTeams = new URLSearchParams(location.search).has("teams");
    }
    if (!enTeams) return;

    setEntrando(true);
    (async () => {
      try {
        const teams = await cargarSdk();
        await conLimite(teams.app.initialize(), 5000);
        const token = await conLimite(teams.authentication.getAuthToken(), 15000);
        const { error } = await createClient().auth.signInWithIdToken({ provider: "azure", token });
        if (error) throw error;
        location.replace("/");
      } catch (e) {
        console.warn("No se pudo entrar automáticamente desde Teams:", e);
        setEntrando(false);
      }
    })();
  }, []);

  return entrando ? <p>Entrando con tu cuenta de Teams…</p> : null;
}
