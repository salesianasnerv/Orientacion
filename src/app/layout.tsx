import type { Metadata, Viewport } from "next";
import { Fira_Sans } from "next/font/google";
import "./globals.css";
import { RegistrarSW } from "@/components/RegistrarSW";

const fira = Fira_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--fuente-fira" });

export const metadata: Metadata = {
  title: "Orientación | Escuelas Salesianas María Auxiliadora · Nervión (Sevilla)",
  description: "Fichas del alumnado, medidas de atención a la diversidad y seguimiento de Orientación (ESO).",
  robots: { index: false, follow: false },
  metadataBase: new URL("https://orientacion-nervion.vercel.app"),
  applicationName: "Orientación",
  appleWebApp: { capable: true, title: "Orientación", statusBarStyle: "default" },
  openGraph: {
    type: "website",
    locale: "es_ES",
    siteName: "Escuelas Salesianas María Auxiliadora",
    title: "Orientación | Escuelas Salesianas María Auxiliadora · Nervión (Sevilla)",
    description: "Atención a la diversidad en ESO: seguimiento del alumnado, medidas, proceso de derivación y documentos.",
    url: "/",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Orientación · Escuelas Salesianas María Auxiliadora" }],
  },
  twitter: { card: "summary_large_image", images: ["/og-image.png"] },
};

export const viewport: Viewport = { themeColor: "#009abb", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={fira.variable}>
      <body>
        {children}
        <RegistrarSW />
        <footer className="pie">Escuelas Salesianas María Auxiliadora · Nervión (Sevilla)</footer>
      </body>
    </html>
  );
}
