import type { CursoAcademico, Grupo, Medida } from "@/lib/datos";
import { createClient } from "@/lib/supabase/server";

export type FilaAlumno = {
  id: string;
  nombre: string;
  apellidos: string;
  grupoId: string | null;
  grupo: string;
  nivelOrden: number;
  tutor: string | null;
  censado: boolean | null;
  tipo: string | null;
  dictamen: boolean;
  diagnostico: string | null;
  medidas: number[];
  repetidor: boolean;
  pendientes: number; // nº de materias pendientes de cursos anteriores
};

const SELECT_GRUPO = "id, letra, curso_academico_id, nivel:nivel_id(nombre, orden), tutor:tutor_id(nombre, email)";

export async function cursosAcademicos() {
  const supabase = await createClient();
  const { data } = await supabase.from("curso_academico").select("id, nombre, activo").order("nombre", { ascending: false }).returns<CursoAcademico[]>();
  return data ?? [];
}

export async function gruposDelCurso(cursoId: number) {
  const supabase = await createClient();
  const { data } = await supabase.from("grupo").select(SELECT_GRUPO).eq("curso_academico_id", cursoId).returns<Grupo[]>();
  return [...(data ?? [])].sort((a, b) => (a.nivel?.orden ?? 0) - (b.nivel?.orden ?? 0) || a.letra.localeCompare(b.letra));
}

export async function catalogoMedidas() {
  const supabase = await createClient();
  const { data } = await supabase.from("catalogo_medida").select("id, codigo, nombre, bloque, descripcion, orden").eq("activa", true).order("orden").returns<Medida[]>();
  return data ?? [];
}

// Todo el alumnado en seguimiento de un curso académico, con su grupo, ficha y medidas.
export async function alumnadoDelCurso(cursoId: number): Promise<FilaAlumno[]> {
  const supabase = await createClient();
  const [grupos, { data: matriculas }, { data: fichas }] = await Promise.all([
    gruposDelCurso(cursoId),
    supabase.from("matricula").select("alumno_id, grupo_id, repetidor, materias_pendientes").eq("curso_academico_id", cursoId),
    supabase.from("ficha_curso").select("id, alumno_id, censado, tipo_neae, dictamen, diagnostico").eq("curso_academico_id", cursoId),
  ]);
  const ids = [...new Set([...(matriculas ?? []).map((m) => m.alumno_id), ...(fichas ?? []).map((f) => f.alumno_id)])];
  const fichaIds = (fichas ?? []).map((f) => f.id);
  const [{ data: alumnos }, { data: medidas }, { data: pendientes }] = await Promise.all([
    supabase.from("alumno").select("id, nombre, apellidos").in("id", ids),
    supabase.from("medida_alumno").select("ficha_id, medida_id").in("ficha_id", fichaIds),
    supabase.from("materia_pendiente").select("ficha_id").in("ficha_id", fichaIds),
  ]);

  const grupoDe = new Map(grupos.map((g) => [g.id, g]));
  const matriculaDe = new Map((matriculas ?? []).map((m) => [m.alumno_id, m]));
  const fichaDe = new Map((fichas ?? []).map((f) => [f.alumno_id, f]));
  const medidasDe = new Map<string, number[]>();
  (medidas ?? []).forEach((m) => medidasDe.set(m.ficha_id, [...(medidasDe.get(m.ficha_id) ?? []), m.medida_id]));
  const pendientesDe = new Map<string, number>();
  (pendientes ?? []).forEach((p) => pendientesDe.set(p.ficha_id, (pendientesDe.get(p.ficha_id) ?? 0) + 1));

  return (alumnos ?? [])
    .map((a) => {
      const m = matriculaDe.get(a.id);
      const g = grupoDe.get(m?.grupo_id ?? "");
      const f = fichaDe.get(a.id);
      // Materias pendientes: las de la ficha (una por fila) o, si no hay, el texto antiguo de la matrícula
      const textoPendientes = m?.materias_pendientes?.split(/[,;\n]/).filter((x: string) => x.trim()).length ?? 0;
      return {
        id: a.id,
        nombre: a.nombre,
        apellidos: a.apellidos,
        grupoId: g?.id ?? null,
        grupo: g ? `${g.nivel?.nombre ?? ""}${g.letra ? " " + g.letra : ""}` : "—",
        nivelOrden: g?.nivel?.orden ?? 99,
        tutor: g?.tutor?.nombre ?? null,
        censado: f ? f.censado : null,
        tipo: f?.tipo_neae ?? null,
        dictamen: f?.dictamen ?? false,
        diagnostico: f?.diagnostico ?? null,
        medidas: f ? (medidasDe.get(f.id) ?? []) : [],
        repetidor: m?.repetidor ?? false,
        pendientes: (f && pendientesDe.get(f.id)) || textoPendientes,
      };
    })
    .sort((x, y) => x.nivelOrden - y.nivelOrden || x.grupo.localeCompare(y.grupo) || x.apellidos.localeCompare(y.apellidos, "es"));
}
