import type { MetadataRoute } from "next";

// Permite instalar la web como app (PWA) en el móvil y el ordenador.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Orientación | Salesianas Nervión",
    short_name: "Orientación",
    description: "Atención a la diversidad en ESO: seguimiento del alumnado, medidas, proceso de derivación y documentos de Orientación.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#f8fafc",
    theme_color: "#009abb",
    lang: "es",
    categories: ["education", "productivity"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
