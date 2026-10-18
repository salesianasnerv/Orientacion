import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Las plantillas Word se leen del disco al generar el documento de seguimiento
  outputFileTracingIncludes: { "/alumno/[id]/seguimiento/docx": ["./src/plantillas/**"] },
};

export default nextConfig;
