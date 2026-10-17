import type { Alumno, CursoAcademico, EntradaHistorial, Ficha, Grupo } from "@/lib/datos";
import { createClient } from "@/lib/supabase/server";

type Matricula = { curso_academico_id: number; repetidor: boolean; materias_pendientes: string | null; grupo: Grupo | null };

// Todo lo que muestra la ficha de un alumno/a, para el curso pedido (o el más reciente).
export async function cargarAlumno(id: string, cursoParam?: string) {
  const supabase = await createClient();
  const [{ data: alumno }, { data: cursos }, { data: matriculas }, { data: fichas }, { data: historial }] = await Promise.all([
    supabase.from("alumno").select("id, nombre, apellidos, nombre_seneca").eq("id", id).returns<Alumno[]>().maybeSingle(),
    supabase.from("curso_academico").select("id, nombre, activo").order("nombre").returns<CursoAcademico[]>(),
    supabase
      .from("matricula")
      .select("curso_academico_id, repetidor, materias_pendientes, grupo:grupo_id(id, letra, curso_academico_id, nivel:nivel_id(nombre, orden), tutor:tutor_id(nombre, email))")
      .eq("alumno_id", id)
      .returns<Matricula[]>(),
    supabase.from("ficha_curso").select("*").eq("alumno_id", id).returns<Ficha[]>(),
    supabase.from("historial").select("id, etiqueta, texto, orden, fuente").eq("alumno_id", id).order("orden").returns<EntradaHistorial[]>(),
  ]);
  if (!alumno) return null;

  const activo = cursos?.find((c) => c.activo);
  const conDatos = new Set([...(fichas ?? []).map((f) => f.curso_academico_id), ...(matriculas ?? []).map((m) => m.curso_academico_id)]);
  const cursosAlumno = (cursos ?? []).filter((c) => conDatos.has(c.id));
  const curso =
    cursosAlumno.find((c) => String(c.id) === cursoParam) ??
    cursosAlumno.find((c) => c.activo) ??
    cursosAlumno.at(-1) ??
    activo ??
    null;

  const ficha = fichas?.find((f) => f.curso_academico_id === curso?.id) ?? null;
  const matricula = matriculas?.find((m) => m.curso_academico_id === curso?.id) ?? null;

  let puedeEditar = false;
  if (ficha) {
    const { data } = await supabase.rpc("puede_editar_ficha", { p_ficha: ficha.id });
    puedeEditar = data === true;
  }
  const { data: puedeEditarAlumno } = await supabase.rpc("puede_editar_alumno", { p_alumno: id });

  return {
    alumno,
    curso,
    cursosAlumno,
    ficha,
    matricula,
    historial: historial ?? [],
    puedeEditar,
    puedeEditarAlumno: puedeEditarAlumno === true,
    puedeCrearFicha: !ficha && !!curso?.activo && puedeEditarAlumno === true,
  };
}
