// Proceso de derivación y seguimiento (texto de «PASOS A SEGUIR DERIVACIÓN-SEGUIMIENTO.docx»).
// Los documentos citados en cada paso enlazan con su original de SharePoint.

const C = "Proceso Derivación Secundaria/";

export const DOCS = {
  d1: { num: "1", titulo: "Medidas generales", ruta: C + "1. Medidas generales.docx" },
  d11: { num: "1.1", titulo: "Explicación de las medidas generales", ruta: C + "1.1. Explicación Medidas generales.doc", slug: "medidas-generales" },
  d12: { num: "1.2", titulo: "Medidas específicas", ruta: C + "1.2. Medidas Específicas.doc", slug: "medidas-especificas" },
  d13: { num: "1.3", titulo: "Programas de atención a la diversidad", ruta: C + "1.3. Programas de Atención a la Diversidad.doc", slug: "programas-diversidad" },
  d2: { num: "2", titulo: "Detección de indicios de NEAE", ruta: C + "2. Detección indicios NEAE.pdf" },
  d3: { num: "3", titulo: "Acta del equipo docente", ruta: C + "3. Acta Equipo Docente.pdf" },
  d4: { num: "4", titulo: "Seguimiento alumnado", ruta: C + "4. Seguimiento alumnado.docx" },
  d5: { num: "5", titulo: "Información a padres e inicio de la evaluación", ruta: C + "5. Información padres inicio Evaluación.pdf" },
  d6: { num: "6", titulo: "Información del contenido del informe", ruta: C + "6. Información Contenido Informe.pdf" },
  d7: { num: "7", titulo: "Recibí copia", ruta: C + "7. Recibí copia.pdf" },
  d8: { num: "8", titulo: "Acta de retirada de medidas", ruta: C + "8. Acta Retirada de Medidas.docx" },
  pasos: { num: "", titulo: "Pasos a seguir (documento original)", ruta: C + "PASOS A SEGUIR DERIVACIÓN-SEGUIMIENTO.docx" },
} as const;

export type ClaveDoc = keyof typeof DOCS;

export type Paso = {
  n: number;
  corto: string; // para la infografía
  quien: string;
  titulo: string;
  parrafos: string[];
  notas?: string[]; // recuadros destacados
  docs: ClaveDoc[];
};

export const NUEVOS: Paso[] = [
  {
    n: 1, corto: "Medidas generales", quien: "Tutor/a + familia", titulo: "Aplicar medidas generales",
    parrafos: [
      "En el caso de detectar a un alumno con dificultades y que necesite recibir medidas ordinarias (medidas generales de atención a la diversidad), cumplimentar el **documento 1** (medidas generales), apoyándose en el **documento 1.1** (explicación medidas generales), donde vienen especificadas todas las medidas existentes y posibles en nuestro centro.",
      "Este documento se muestra a la familia en una tutoría, **la familia debe firmarlo**. Este documento debe ser escaneado y subido a SharePoint al expediente del alumno (orientación-25.26 medidas).",
    ],
    docs: ["d1", "d11"],
  },
  {
    n: 2, corto: "Detección NEAE", quien: "Tutor/a", titulo: "Detección de indicios de NEAE (≈ 3 meses después)",
    parrafos: [
      "Pasados aproximadamente **3 meses**, si el alumno no evoluciona con la aplicación de medidas generales de atención a la diversidad, cumplimentar el **documento 2** de la carpeta: «Detección Indicios NEAE ESO». Es responsabilidad del tutor/a obtener información de las dificultades del alumnado en todas las áreas.",
    ],
    notas: ["Cuando se deriva a un alumno/a hay que **adjuntar evidencia** de ello (registro observacional de comportamiento, alguna ficha realizada por el alumno…). Lo que se adjunta debe estar relacionado con el motivo de derivación."],
    docs: ["d2"],
  },
  {
    n: 3, corto: "Equipo docente", quien: "Tutor/a + coordinación", titulo: "Reunión del equipo docente",
    parrafos: [
      "El/la tutor/a informa a la coordinadora y directora Pedagógica sobre las dificultades observadas en el alumno/a. En la medida de lo posible la directora Pedagógica de Infantil y Primaria convocará una reunión para tratar el tema.",
      "En esta reunión el/la tutor/a cumplimenta el **documento 3**: «Acta Equipo docente» (debe aparecer el nombre y apellido de todo el equipo docente que le da clase al alumno/a derivado/a).",
      "Para la selección de las medidas a tomar, debemos volver a revisar el **documento 1.1** (explicación medidas generales) y tomar como punto de partida y referencia el **documento 1** que ya se mostró a la familia.",
    ],
    docs: ["d3", "d11", "d1"],
  },
  {
    n: 4, corto: "Seguimiento", quien: "Tutor/a + familia", titulo: "Documento de seguimiento y tutoría con la familia",
    parrafos: [
      "Cumplimentar el **documento 4** «Seguimiento alumnado» (solo la columna de medidas generales hasta finalizar la evaluación psicopedagógica) y mostrarlo a la familia en una tutoría. **La familia debe firmarlo** y estar de acuerdo con el inicio de la evaluación psicopedagógica.",
    ],
    docs: ["d4"],
  },
  {
    n: 5, corto: "Evaluación psicopedagógica", quien: "Tutor/a + Orientación", titulo: "Solicitud de la evaluación psicopedagógica",
    parrafos: [
      "Si se agravan las circunstancias que dieron lugar a esta intervención o se aprecian indicios evidentes de NEAE apoyados por informes externos, **no es necesario agotar el plazo de los 3 meses** para solicitar la evaluación psicopedagógica.",
      "En el caso de precisar Medidas Específicas o Programas de Refuerzo del Aprendizaje, hay que esperar para su elección a la finalización de la evaluación psicopedagógica, haciendo entrega a la familia del **documento 5**: «Información padres inicio de Evaluación» para que la autorice (este documento se entrega junto con el **documento 4**).",
      "Es el departamento de Orientación el que realiza la evaluación psicopedagógica, si el alumnado pertenece al «Servicio de Orientación Complementario».",
    ],
    docs: ["d5", "d4"],
  },
  {
    n: 6, corto: "Informe y nuevas medidas", quien: "Equipo docente + Orientación + familia", titulo: "Resultados del informe y nuevas medidas",
    parrafos: [
      "Al finalizar la evaluación psicopedagógica del alumnado que lo requiera, el equipo docente decide si precisa alguna medida específica de atención a la diversidad o Programa de atención a la diversidad, quedando recogidas en el informe de evaluación psicopedagógica.",
      "A continuación, citar a la familia para informar de los resultados del informe y de las nuevas medidas adoptadas. **A esta reunión os acompañará alguien del equipo de Orientación.** A esta tutoría hay que llevar el **documento 6**: «Información del contenido del informe» y el **documento 7**: «Recibí copia».",
      "Añadir las nuevas medidas (específicas y programas de atención a la diversidad) al **documento 4** «Seguimiento alumnado»; utilizar la explicación del **documento 1.2** «Medidas Específicas» y **1.3** «Programas de Atención a la Diversidad» para seleccionar las medidas más adecuadas.",
    ],
    notas: ["Todos los documentos se los queda el colegio; en el caso de que la familia solicite una copia de alguno de ellos, solicitarla al equipo de Orientación."],
    docs: ["d6", "d7", "d4", "d12", "d13"],
  },
  {
    n: 7, corto: "Antes de cada evaluación", quien: "Tutor/a", titulo: "Antes de cada sesión de evaluación NEAE",
    parrafos: [
      "Es importante que antes de cada sesión de evaluación NEAE, todas las medidas que tenga el alumno/a estén recogidas en el **documento 4** «Seguimiento alumnado», para poder hacer la valoración de las medidas y afrontar la siguiente evaluación.",
      "Esta plantilla debe subirse a la siguiente ruta: Curso 2025-26 / Orientación / 2025-26. Medidas alumnado / Curso al que el alumno pertenece.",
    ],
    docs: ["d4"],
  },
  {
    n: 8, corto: "Entrega a Orientación", quien: "Tutor/a", titulo: "Custodia de la documentación",
    parrafos: ["Todos los documentos cumplimentados hasta el momento deben ser entregados al departamento de Orientación para su custodia, en papel o escaneados."],
    docs: [],
  },
];

export const SEGUIMIENTO: Paso[] = [
  {
    n: 1, corto: "Revisar medidas", quien: "Tutor/a + equipo docente", titulo: "Revisar las medidas del curso anterior",
    parrafos: [
      "Revisar las medidas del curso 2024-25 recogidas en SharePoint: Curso 2025-26 / Orientación / 2024-25 Medidas alumnado.",
      "Estas medidas, junto con las acordadas en la sesión de evaluación inicial, se pasan al **documento 1** «Medidas generales» (en el caso de que los alumnos solo tengan medidas generales de atención a la diversidad) o al **documento 4** «Seguimiento alumnado» (si los alumnos además de medidas generales tienen medidas específicas y/o Programas de atención a la diversidad), lo más explicadas posible, apoyándonos en los documentos **1.1** (Medidas Generales), **1.2** (Medidas Específicas) y **1.3** (Programas de Atención a la Diversidad).",
      "Esta plantilla debe subirse a la siguiente ruta: Curso 2025-2026 / Orientación / 2025-26. Medidas alumnado / curso al que el alumno/a pertenece.",
    ],
    notas: ["Este documento tiene que ser revisado por el/la tutor/a, con la opinión del equipo docente, en la **sesión de evaluación inicial**."],
    docs: ["d1", "d4", "d11", "d12", "d13"],
  },
  {
    n: 2, corto: "Informar a la familia", quien: "Tutor/a + familia", titulo: "Tutoría con la familia",
    parrafos: [
      "Citar a la familia para informarles de las medidas del presente curso, dejar recogidos en el acta del tutor los acuerdos y añadir las modificaciones acordadas en la plantilla de medidas para que todo el equipo docente tenga acceso a las nuevas medidas adoptadas.",
      "En el caso de que haya modificaciones de las medidas, **este documento deberá ser firmado por las familias** en una tutoría. Este documento se entregará al departamento de Orientación para su custodia.",
      "En el caso de precisar medidas específicas un alumno que hasta el momento solo ha tenido medidas generales de atención a la diversidad, proceder a la evaluación psicopedagógica, haciendo entrega a la familia del **documento 5**: «Información padres inicio de Evaluación» para que la autorice. Es el departamento de Orientación el que realiza la evaluación psicopedagógica, si el alumnado pertenece al «Servicio de Orientación Complementario».",
    ],
    notas: [
      "Todos los documentos se los queda el colegio; en el caso de que la familia solicite una copia de alguno de ellos, solicitarla al equipo de Orientación.",
      "La familia **siempre se lleva una copia** del documento, nunca el original.",
    ],
    docs: ["d5"],
  },
  {
    n: 3, corto: "Antes de cada evaluación", quien: "Tutor/a", titulo: "Antes de cada sesión de evaluación NEAE",
    parrafos: [
      "Es importante que antes de cada sesión de evaluación NEAE, todas las medidas que tenga el alumno/a estén recogidas en el **documento 1** «Medidas generales» (en el caso de que los alumnos solo tengan medidas generales de atención a la diversidad) o en el **documento 4** «Seguimiento alumnado» (si además de medidas generales tienen medidas específicas y/o Programas de atención a la diversidad), para poder hacer la valoración de las medidas y afrontar la siguiente evaluación.",
    ],
    docs: ["d1", "d4"],
  },
  {
    n: 4, corto: "Retirada de medidas", quien: "Equipo docente + familia", titulo: "Retirada de medidas (si procede)",
    parrafos: [
      "Si a lo largo del curso académico el equipo docente del alumno (en las sesiones de evaluación) considera la «retirada de medidas de atención a la diversidad», rellenar el **documento 8**: «Acta de retirada de medidas de atención a la diversidad» e informar a las familias en una tutoría; **la familia debe firmarlo**. Este documento se entregará al departamento de Orientación para su custodia.",
    ],
    docs: ["d8"],
  },
];

export const IMPORTANTE = [
  "Todos estos documentos tienen que quedar **archivados en SharePoint**. Para ello aconsejamos que en la misma ruta (Curso 2025-26 / Orientación / 2025-26 Medidas alumnado / Curso) se abra una carpeta del alumno para facilitar su organización.",
  "Todas las **medidas generales** de atención a la diversidad deben quedar registradas en **Séneca** en el informe final del tutor/a.",
  "Todas las **medidas específicas y los programas** de atención a la diversidad deben quedar registrados en **Séneca** en el apartado establecido para ello.",
];
