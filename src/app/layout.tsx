import type { Metadata } from "next";
import { Fira_Sans } from "next/font/google";
import "./globals.css";

const fira = Fira_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--fuente-fira" });

export const metadata: Metadata = {
  title: "Orientación | Escuelas Salesianas María Auxiliadora · Nervión (Sevilla)",
  description: "Fichas del alumnado, medidas de atención a la diversidad y seguimiento de Orientación (ESO).",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={fira.variable}>
      <body>
        {children}
        <footer className="pie">Escuelas Salesianas María Auxiliadora · Nervión (Sevilla)</footer>
      </body>
    </html>
  );
}
