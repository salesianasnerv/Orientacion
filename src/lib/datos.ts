export const TIPOS_NEAE: Record<string, string> = {
  NEE: "Necesidades educativas especiales",
  DIA: "Dificultades de aprendizaje",
  AACC: "Altas capacidades intelectuales",
  COM: "Compensación educativa",
};

export type Bloque = "general" | "metodologia" | "evaluacion" | "prueba_escrita" | "especifica" | "programa";

export type Medida = { id: number; codigo: string | null; nombre: string; bloque: Bloque; descripcion: string | null; orden: number };

// Bloques en el orden de los documentos de Orientación, agrupados como se muestran en la ficha
export const BLOQUES: { clave: Bloque; titulo: string; abrev: string }[] = [
  { clave: "general", titulo: "Medidas generales", abrev: "MG" },
  { clave: "metodologia", titulo: "Metodología", abrev: "MET" },
  { clave: "evaluacion", titulo: "Evaluación", abrev: "EV" },
  { clave: "prueba_escrita", titulo: "Adaptación de las pruebas escritas", abrev: "PE" },
  { clave: "especifica", titulo: "Medidas específicas", abrev: "ESP" },
  { clave: "programa", titulo: "Programas de atención a la diversidad", abrev: "PROG" },
];

export const GRUPOS_DE_BLOQUES = [
  { titulo: "Medidas generales", bloques: ["general", "metodologia", "evaluacion", "prueba_escrita"] as Bloque[] },
  { titulo: "Medidas específicas y programas", bloques: ["especifica", "programa"] as Bloque[] },
];

export function tituloBloque(b: Bloque) {
  return BLOQUES.find((x) => x.clave === b)?.titulo ?? b;
}

export type Grupo = {
  id: string;
  letra: string;
  curso_academico_id: number;
  nivel: { nombre: string; orden: number } | null;
  tutor: { nombre: string; email: string } | null;
};

export type CursoAcademico = { id: number; nombre: string; activo: boolean };

export type Ficha = {
  id: string;
  alumno_id: string;
  curso_academico_id: number;
  censado: boolean;
  tipo_neae: string | null;
  diagnostico: string | null;
  dictamen: boolean;
  materias: string | null;
  atencion_recibida: string | null;
  observaciones: string | null;
  propuesta_medidas: string | null;
};

export type Alumno = { id: string; nombre: string; apellidos: string; nombre_seneca: string | null };

export type EntradaHistorial = { id: string; etiqueta: string; texto: string; orden: number; fuente: string };

export function nombreGrupo(g: Pick<Grupo, "letra" | "nivel">) {
  return `${g.nivel?.nombre ?? ""}${g.letra ? " " + g.letra : ""}`;
}

export function nombreCompleto(a: Pick<Alumno, "nombre" | "apellidos">) {
  return `${a.apellidos}, ${a.nombre}`;
}

// "Apellidos, Nombre" (Séneca) → partes
export function partirNombreSeneca(s: string) {
  const [apellidos, nombre] = s.split(",").map((x) => x.trim());
  return { apellidos: apellidos ?? s, nombre: nombre ?? "" };
}
