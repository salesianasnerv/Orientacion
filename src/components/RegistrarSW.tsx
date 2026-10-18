"use client";

import { useEffect } from "react";

// Registra el service worker (public/sw.js) para que la web se pueda instalar como app.
export function RegistrarSW() {
  useEffect(() => {
    if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return null;
}
