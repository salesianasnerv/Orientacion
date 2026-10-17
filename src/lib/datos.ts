export const TIPOS_NEAE: Record<string, string> = {
  NEE: "Necesidades educativas especiales",
  DIA: "Dificultades de aprendizaje",
  AACC: "Altas capacidades intelectuales",
  COM: "Compensación educativa",
};

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
