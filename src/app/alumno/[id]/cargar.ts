import type { CursoAcademico, EntradaHistorial, Ficha, Grupo, Medida } from "@/lib/datos";
import { catalogoMedidas } from "@/lib/consultas";
import { createClient } from "@/lib/supabase/server";

type AlumnoCompleto = {
  id: string;
  nombre: string;
  apellidos: string;
  nombre_seneca: string | null;
  expediente_url: string | null;
  carpeta_medidas_url: string | null;
};
export type MateriaPendiente = { nivel: string; materia: string; profesor: string | null };
type Matricula = { curso_academico_id: number; grupo_id: string; repetidor: boolean; materias_pendientes: string | null };

// Todo lo que muestra la ficha de un alumno/a, para el curso pedido (o el más reciente).
export async function cargarAlumno(id: string, cursoParam?: string) {
  const supabase = await createClient();
  const [{ data: alumno }, { data: cursos }, { data: matriculas }, { data: fichas }, { data: historial }, catalogo, { data: config }] =
    await Promise.all([
      supabase.from("alumno").select("id, nombre, apellidos, nombre_seneca, expediente_url, carpeta_medidas_url").eq("id", id).returns<AlumnoCompleto[]>().maybeSingle(),
      supabase.from("curso_academico").select("id, nombre, activo").order("nombre").returns<CursoAcademico[]>(),
      supabase.from("matricula").select("curso_academico_id, grupo_id, repetidor, materias_pendientes").eq("alumno_id", id).returns<Matricula[]>(),
      supabase.from("ficha_curso").select("*").eq("alumno_id", id).returns<Ficha[]>(),
      supabase.from("historial").select("id, etiqueta, texto, orden, fuente").eq("alumno_id", id).order("orden", { ascending: false }).returns<EntradaHistorial[]>(),
      catalogoMedidas(),
      supabase.from("configuracion").select("valor").eq("clave", "sharepoint_expedientes").maybeSingle(),
    ]);
  if (!alumno) return null;

  const conDatos = new Set([...(fichas ?? []).map((f) => f.curso_academico_id), ...(matriculas ?? []).map((m) => m.curso_academico_id)]);
  const cursosAlumno = (cursos ?? []).filter((c) => conDatos.has(c.id));
  const curso =
    cursosAlumno.find((c) => String(c.id) === cursoParam) ?? cursosAlumno.find((c) => c.activo) ?? cursosAlumno.at(-1) ?? cursos?.find((c) => c.activo) ?? null;

  const ficha = fichas?.find((f) => f.curso_academico_id === curso?.id) ?? null;
  const matricula = matriculas?.find((m) => m.curso_academico_id === curso?.id) ?? null;

  const [{ data: grupo }, { data: marcadas }, { data: puedeFicha }, { data: puedeAlumno }, { data: pendientes }] = await Promise.all([
    matricula
      ? supabase.from("grupo").select("id, letra, curso_academico_id, nivel:nivel_id(nombre, orden), tutor:tutor_id(nombre, email)").eq("id", matricula.grupo_id).returns<Grupo[]>().maybeSingle()
      : Promise.resolve({ data: null }),
    ficha ? supabase.from("medida_alumno").select("medida_id").eq("ficha_id", ficha.id).is("evaluacion", null) : Promise.resolve({ data: [] }),
    ficha ? supabase.rpc("puede_editar_ficha", { p_ficha: ficha.id }) : Promise.resolve({ data: false }),
    supabase.rpc("puede_editar_alumno", { p_alumno: id }),
    ficha
      ? supabase.from("materia_pendiente").select("nivel, materia, profesor").eq("ficha_id", ficha.id).order("orden").returns<MateriaPendiente[]>()
      : Promise.resolve({ data: [] as MateriaPendiente[] }),
  ]);

  const idsMarcadas = new Set((marcadas ?? []).map((m: { medida_id: number }) => m.medida_id));

  return {
    alumno,
    curso,
    cursosAlumno,
    ficha,
    matricula,
    grupo: grupo as Grupo | null,
    historial: historial ?? [],
    pendientes: pendientes ?? [],
    catalogo: catalogo as Medida[],
    medidas: (catalogo as Medida[]).filter((m) => idsMarcadas.has(m.id)),
    idsMarcadas,
    carpetaExpedientes: (config?.valor as string | undefined) ?? null,
    puedeEditar: puedeFicha === true,
    puedeEditarAlumno: puedeAlumno === true,
    puedeCrearFicha: !ficha && !!curso?.activo && puedeAlumno === true,
  };
}
