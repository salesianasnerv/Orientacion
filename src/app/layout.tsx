import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Orientación · Salesianas Nervión",
  description: "Plataforma de Orientación: fichas del alumnado, medidas y seguimiento",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
