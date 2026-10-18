// Índice de documentos del portal. Los originales están en SharePoint (E-NER › Claustro › ESO › 06 - Orientación);
// los que tienen texto se han convertido a Markdown (documentos.ts) para leerlos dentro de la web.

const BASE = "/sites/E-NER/Claustro/ESO/Documentos compartidos/06 - Orientación";
const VISTA = "https://salesianas.sharepoint.com/sites/E-NER/Claustro/ESO/Documentos%20compartidos/Forms/AllItems.aspx";

// Carpetas subidas desde el Mac: SharePoint guarda sus tildes descompuestas (o + ´) y el visor solo abre el nombre exacto
const CARPETAS_NFD = ["Proceso Derivación Secundaria/", "Plantillas/", "Recursos/"];

export function urlSharePoint(ruta: string) {
  const exacta = CARPETAS_NFD.some((c) => ruta.startsWith(c)) ? ruta.normalize("NFD") : ruta;
  const completa = `${BASE}/${exacta}`;
  const carpeta = completa.slice(0, completa.lastIndexOf("/"));
  const esCarpeta = !/\.\w{3,4}$/.test(ruta);
  return esCarpeta
    ? `${VISTA}?id=${encodeURIComponent(completa)}`
    : `${VISTA}?id=${encodeURIComponent(completa)}&parent=${encodeURIComponent(carpeta)}`;
}

export type Documento = {
  titulo: string;
  ruta: string; // relativa a «06 - Orientación»
  slug?: string; // si se puede leer en la web
  nota?: string;
  versiones?: { ext: string; url: string }[]; // enlaces leídos en directo de SharePoint (Word, PDF…)
};

export type Apartado = { titulo: string; descripcion?: string; documentos: Documento[] };

export const DERIVACION: Apartado[] = [
  {
    titulo: "Cómo actuar",
    documentos: [
      { titulo: "Pasos para la derivación y el seguimiento", ruta: "Proceso Derivación Secundaria/PASOS A SEGUIR DERIVACIÓN-SEGUIMIENTO.docx", slug: "pasos-derivacion" },
    ],
  },
  {
    titulo: "Medidas de atención a la diversidad",
    descripcion: "Las mismas medidas que se marcan en la ficha de cada alumno/a.",
    documentos: [
      { titulo: "1.1 Explicación de las medidas generales", ruta: "Proceso Derivación Secundaria/1.1. Explicación Medidas generales.doc", slug: "medidas-generales" },
      { titulo: "1.2 Medidas específicas", ruta: "Proceso Derivación Secundaria/1.2. Medidas Específicas.doc", slug: "medidas-especificas" },
      { titulo: "1.3 Programas de atención a la diversidad", ruta: "Proceso Derivación Secundaria/1.3. Programas de Atención a la Diversidad.doc", slug: "programas-diversidad" },
    ],
  },
];

export const PLANTILLAS: Apartado[] = [
  {
    titulo: "Registro y seguimiento de medidas",
    descripcion: "Según el alumno/a esté censado o no en Séneca. Desde la ficha de cada alumno/a se generan ya rellenas.",
    documentos: [
      { titulo: "Alumnado censado", ruta: "Plantillas/Atención a la Diversidad/Registro y seguimiento - Alumnado censado.docx" },
      { titulo: "Alumnado sin censar", ruta: "Plantillas/Atención a la Diversidad/Registro y seguimiento - Alumnado sin censar.docx" },
    ],
  },
  {
    titulo: "Derivación",
    descripcion: "El colegio se queda el original; la familia, una copia.",
    documentos: [
      { titulo: "Detección de indicios de NEAE", ruta: "Plantillas/Proceso de derivación/2. Detección indicios NEAE.pdf" },
      { titulo: "Acta del equipo docente", ruta: "Plantillas/Proceso de derivación/3. Acta Equipo Docente.pdf" },
      { titulo: "Información a padres | Inicio de la evaluación", ruta: "Plantillas/Proceso de derivación/5. Información padres inicio Evaluación.pdf" },
      { titulo: "Información a padres | Contenido del informe", ruta: "Plantillas/Proceso de derivación/6. Información Contenido Informe.pdf" },
      { titulo: "Información a padres | Recibí informe", ruta: "Plantillas/Proceso de derivación/7. Recibí copia.pdf" },
      { titulo: "Acta de retirada de medidas", ruta: "Plantillas/Proceso de derivación/8. Acta Retirada de Medidas.docx" },
    ],
  },
  {
    titulo: "Autorizaciones",
    documentos: [
      { titulo: "Autorización a entidad externa", ruta: "Plantillas/Autorizaciones/Autorización Entidad Externa.docx" },
      { titulo: "Autorización de entrevista personal", ruta: "Plantillas/Autorizaciones/Autorización entrevista.docx" },
    ],
  },
];

export const TUTORIAL: Apartado[] = [
  {
    titulo: "Plan de Acción Tutorial",
    documentos: [
      { titulo: "PAT ESO", ruta: "PAT Plan de Acción Tutorial/PAT ESO.pdf", nota: "320 páginas" },
      { titulo: "Bienestar emocional", ruta: "PAT Plan de Acción Tutorial/Bienestar emocional.pdf" },
      { titulo: "TRICs", ruta: "PAT Plan de Acción Tutorial/TRICs.pdf" },
    ],
  },
  {
    titulo: "Safety (uso seguro de internet)",
    documentos: [
      { titulo: "Revisión de las 3 sesiones", ruta: "PAT Plan de Acción Tutorial/Safety/Revisión de las 3 sesiones.pdf" },
      { titulo: "Sesión 1 · La netiqueta: actividades", ruta: "PAT Plan de Acción Tutorial/Safety/Sesión 1. La Netiquetas/Actividades.pdf" },
      { titulo: "Sesión 1 · La netiqueta: desarrollo del taller", ruta: "PAT Plan de Acción Tutorial/Safety/Sesión 1. La Netiquetas/Desarrollo taller.pptx" },
      { titulo: "Sesión 2 · Audiencia, huella digital y privacidad: actividades", ruta: "PAT Plan de Acción Tutorial/Safety/Sesión 2. Audiencia, huella digital y privacidad/Actividades.pdf" },
      { titulo: "Sesión 2 · Audiencia, huella digital y privacidad: desarrollo del taller", ruta: "PAT Plan de Acción Tutorial/Safety/Sesión 2. Audiencia, huella digital y privacidad/Desarrollo taller.pptx" },
      { titulo: "Sesión 3 · Engaños en la red: actividades", ruta: "PAT Plan de Acción Tutorial/Safety/Sesión 3. Engaños en la red/Actividades.pdf" },
      { titulo: "Sesión 3 · Engaños en la red: desarrollo del taller", ruta: "PAT Plan de Acción Tutorial/Safety/Sesión 3. Engaños en la red/Desarrollo taller.pptx" },
    ],
  },
];

export const RECURSOS: Apartado[] = [
  {
    titulo: "TDAH",
    documentos: [
      { titulo: "Medidas generales TDAH", ruta: "Recursos/Medidas generales TDAH.pdf" },
      { titulo: "Pautas TDAH (orientaciones para el profesorado)", ruta: "Recursos/Pautas TDAH.pdf" },
      { titulo: "TDAH: orientaciones prácticas", ruta: "Recursos/TDAH Orientaciones prácticas.pdf" },
    ],
  },
  {
    titulo: "Aprendizaje y evaluación",
    documentos: [
      { titulo: "Cómo adaptar los exámenes", ruta: "Recursos/Como adaptar los examenes.pdf" },
      { titulo: "Indicadores de dislexia", ruta: "Recursos/INDICADORES DE DISLEXIA.pdf" },
      { titulo: "Fortalecer la memoria", ruta: "Recursos/Fortalecer la memoria.pdf" },
      { titulo: "Adaptaciones NEAE: 17 tipologías", ruta: "Recursos/ADAPTACIONES NEAE 17 TIPOLOGÍAS.pdf", nota: "114 páginas" },
    ],
  },
  {
    titulo: "Convivencia, emociones y salud mental",
    documentos: [
      { titulo: "Pautas: normas claras", ruta: "Recursos/Pautas normas claras.pdf" },
      { titulo: "Emociones (guía del alumnado)", ruta: "Recursos/Emociones.pdf" },
      { titulo: "Asperger: orientaciones prácticas", ruta: "Recursos/ASPERGER Orientaciones Prácticas.pdf" },
      { titulo: "Salud mental", ruta: "Recursos/SALUD MENTAL.pdf" },
    ],
  },
];

export const TODOS = [...DERIVACION, ...PLANTILLAS, ...TUTORIAL, ...RECURSOS].flatMap((a) => a.documentos);
