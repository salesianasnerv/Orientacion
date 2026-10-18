import { nombreCompleto, nombreGrupo, TIPOS_NEAE } from "@/lib/datos";
import type { DatosDocumento, Evaluacion } from "@/lib/documentoSeguimiento";
import { createClient } from "@/lib/supabase/server";
import { cargarAlumno } from "../cargar";

// Datos de la ficha de un curso → lo que necesita la plantilla de seguimiento
export async function datosSeguimiento(id: string, cursoParam?: string) {
  const d = await cargarAlumno(id, cursoParam);
  if (!d?.ficha) return null;
  const { alumno, curso, ficha, matricula, grupo, medidas, pendientes } = d;

  const supabase = await createClient();
  const [{ data: necesidades }, { data: valoraciones }] = await Promise.all([
    supabase.from("necesidad_detectada").select("evaluacion, necesidad:necesidad_id(nombre)").eq("ficha_id", ficha.id)
      .returns<{ evaluacion: Evaluacion; necesidad: { nombre: string } | null }[]>(),
    supabase.from("valoracion_evaluacion").select("evaluacion, resultado, explicacion").eq("ficha_id", ficha.id)
      .returns<DatosDocumento["valoraciones"]>(),
  ]);

  const datos: DatosDocumento = {
    censado: ficha.censado,
    alumno: nombreCompleto(alumno),
    cursoAcademico: curso?.nombre ?? "",
    grupo: grupo ? nombreGrupo(grupo) : "",
    tutor: grupo?.tutor?.nombre ?? "",
    tipoNeae: ficha.tipo_neae ? `${ficha.tipo_neae} · ${TIPOS_NEAE[ficha.tipo_neae] ?? ""}` : null,
    dictamen: ficha.dictamen,
    materias: ficha.materias,
    pendientes: pendientes.length
      ? pendientes.map((p) => `${p.materia} (${p.nivel})${p.profesor ? ` – ${p.profesor}` : ""}`).join("\n")
      : (matricula?.materias_pendientes ?? null),
    repetidor: !!matricula?.repetidor,
    area: ficha.area ?? null,
    profesorReferencia: ficha.profesor_referencia ?? null,
    medidas,
    aspectos: ficha.propuesta_medidas,
    evaluaciones: [ficha.eval_medidas_1, ficha.eval_medidas_2, ficha.eval_medidas_ordinaria],
    obs: { metodologia: ficha.obs_metodologia, evaluacion: ficha.obs_evaluacion, prueba_escrita: ficha.obs_pruebas_escritas },
    necesidades: (necesidades ?? []).filter((n) => n.necesidad).map((n) => ({ nombre: n.necesidad!.nombre, evaluacion: n.evaluacion })),
    valoraciones: valoraciones ?? [],
  };
  const nombreArchivo = `Seguimiento ${ficha.censado ? "censado" : "sin censar"} - ${nombreCompleto(alumno)} - ${curso?.nombre ?? ""}`;
  return { d, datos, nombreArchivo };
}
