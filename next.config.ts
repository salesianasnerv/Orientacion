import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Las plantillas Word se leen del disco al generar el documento de seguimiento y la ficha
  outputFileTracingIncludes: { "/alumno/[id]/seguimiento/docx": ["./src/plantillas/**"], "/alumno/[id]/ficha/docx": ["./src/plantillas/**"] },
};

export default nextConfig;
