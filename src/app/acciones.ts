"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { partirNombreSeneca } from "@/lib/datos";
import { createClient } from "@/lib/supabase/server";

const SIN_PERMISO = "No tienes permiso para hacer este cambio.";

function texto(form: FormData, campo: string) {
  const v = String(form.get(campo) ?? "").trim();
  return v === "" ? null : v;
}

// Alta en seguimiento de un alumno/a de la lista de clase («Acceso a Microsoft 365»).
export async function incorporarAlSeguimiento(form: FormData) {
  const grupoId = String(form.get("grupo_id"));
  const cursoId = Number(form.get("curso_academico_id"));
  const nombreSeneca = String(form.get("nombre_seneca"));
  const supabase = await createClient();

  const { data: alumno, error } = await supabase
    .from("alumno")
    .insert({ ...partirNombreSeneca(nombreSeneca), nombre_seneca: nombreSeneca })
    .select("id")
    .single();
  if (error || !alumno) throw new Error(error?.message ?? SIN_PERMISO);

  const { error: e2 } = await supabase
    .from("matricula")
    .insert({ alumno_id: alumno.id, grupo_id: grupoId, curso_academico_id: cursoId });
  if (e2) {
    await supabase.from("alumno").delete().eq("id", alumno.id);
    throw new Error(e2.message);
  }
  await supabase.from("ficha_curso").insert({ alumno_id: alumno.id, curso_academico_id: cursoId });

  revalidatePath(`/grupo/${grupoId}`);
  redirect(`/alumno/${alumno.id}/editar`);
}

// Crea la ficha del curso indicado copiando lo estable del curso anterior.
export async function crearFichaCurso(form: FormData) {
  const alumnoId = String(form.get("alumno_id"));
  const cursoId = Number(form.get("curso_academico_id"));
  const supabase = await createClient();

  const { data: anterior } = await supabase
    .from("ficha_curso")
    .select("id, censado, tipo_neae, diagnostico, dictamen, propuesta_medidas")
    .eq("alumno_id", alumnoId)
    .lt("curso_academico_id", cursoId)
    .order("curso_academico_id", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { id: anteriorId, ...datos } = anterior ?? { id: null };
  const { data: nueva, error } = await supabase
    .from("ficha_curso")
    .insert({ alumno_id: alumnoId, curso_academico_id: cursoId, ...datos })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  // Punto de partida: las mismas medidas que el curso anterior
  if (anteriorId) {
    const { data: previas } = await supabase.from("medida_alumno").select("medida_id").eq("ficha_id", anteriorId).is("evaluacion", null);
    if (previas?.length) {
      await supabase.from("medida_alumno").insert(previas.map((m) => ({ ficha_id: nueva.id, medida_id: m.medida_id, evaluacion: null })));
    }
  }

  redirect(`/alumno/${alumnoId}/editar?curso=${cursoId}`);
}

function enlace(form: FormData, campo: string) {
  const v = texto(form, campo);
  if (v && !v.startsWith("https://salesianas.sharepoint.com/")) throw new Error("Los enlaces deben ser de https://salesianas.sharepoint.com/");
  return v;
}

export async function guardarFicha(form: FormData) {
  const fichaId = String(form.get("ficha_id"));
  const alumnoId = String(form.get("alumno_id"));
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("ficha_curso")
    .update({
      censado: form.get("censado") === "on",
      dictamen: form.get("dictamen") === "on",
      tipo_neae: texto(form, "tipo_neae"),
      diagnostico: texto(form, "diagnostico"),
      propuesta_medidas: texto(form, "propuesta_medidas"),
      eval_medidas_1: texto(form, "eval_medidas_1"),
      eval_medidas_2: texto(form, "eval_medidas_2"),
      eval_medidas_ordinaria: texto(form, "eval_medidas_ordinaria"),
    })
    .eq("id", fichaId)
    .select("curso_academico_id");
  if (error) throw new Error(error.message);
  if (!data?.length) throw new Error(SIN_PERMISO);

  // Medidas del curso: deja marcadas exactamente las casillas enviadas
  const marcadas = new Set(form.getAll("medida").map(Number));
  const { data: actuales } = await supabase.from("medida_alumno").select("id, medida_id").eq("ficha_id", fichaId).is("evaluacion", null);
  const quitar = (actuales ?? []).filter((m) => !marcadas.has(m.medida_id)).map((m) => m.id);
  const poner = [...marcadas].filter((id) => !(actuales ?? []).some((m) => m.medida_id === id));
  if (quitar.length) {
    const { error: e } = await supabase.from("medida_alumno").delete().in("id", quitar);
    if (e) throw new Error(e.message);
  }
  if (poner.length) {
    const { error: e } = await supabase.from("medida_alumno").insert(poner.map((medida_id) => ({ ficha_id: fichaId, medida_id, evaluacion: null })));
    if (e) throw new Error(e.message);
  }

  // Repetidor/a: está en la matrícula del curso
  const { error: eRep } = await supabase
    .from("matricula")
    .update({ repetidor: form.get("repetidor") === "on" })
    .eq("alumno_id", alumnoId)
    .eq("curso_academico_id", data[0].curso_academico_id);
  if (eRep) throw new Error(eRep.message);

  // Materias pendientes: se sustituyen por las filas enviadas
  const niveles = form.getAll("pend_nivel").map(String);
  const materias = form.getAll("pend_materia").map(String);
  const profesores = form.getAll("pend_profesor").map(String);
  const pendientes = niveles
    .map((nivel, i) => ({ ficha_id: fichaId, nivel, materia: materias[i] ?? "", profesor: profesores[i] || null, orden: i }))
    .filter((p) => p.nivel && p.materia);
  const { error: ePend } = await supabase.from("materia_pendiente").delete().eq("ficha_id", fichaId);
  if (ePend) throw new Error(ePend.message);
  if (pendientes.length) {
    const { error: e } = await supabase.from("materia_pendiente").insert(pendientes);
    if (e) throw new Error(e.message);
  }

  if (form.has("expediente_url")) {
    const { error: e } = await supabase
      .from("alumno")
      .update({ expediente_url: enlace(form, "expediente_url"), carpeta_medidas_url: enlace(form, "carpeta_medidas_url") })
      .eq("id", alumnoId);
    if (e) throw new Error(e.message);
  }

  revalidatePath("/", "layout");
  redirect(`/alumno/${alumnoId}?curso=${data[0].curso_academico_id}`);
}

export async function guardarEntradaHistorial(form: FormData) {
  const id = texto(form, "id");
  const alumnoId = String(form.get("alumno_id"));
  const etiqueta = texto(form, "etiqueta");
  const contenido = texto(form, "texto");
  if (!etiqueta || !contenido) return;
  const supabase = await createClient();

  if (id) {
    const { data, error } = await supabase.from("historial").update({ etiqueta, texto: contenido }).eq("id", id).select("id");
    if (error) throw new Error(error.message);
    if (!data?.length) throw new Error(SIN_PERMISO);
  } else {
    const { data: ultima } = await supabase
      .from("historial")
      .select("orden")
      .eq("alumno_id", alumnoId)
      .order("orden", { ascending: false })
      .limit(1)
      .maybeSingle();
    const { error } = await supabase
      .from("historial")
      .insert({ alumno_id: alumnoId, etiqueta, texto: contenido, orden: (ultima?.orden ?? 0) + 1 });
    if (error) throw new Error(error.message);
  }
  revalidatePath(`/alumno/${alumnoId}`);
}

export async function borrarEntradaHistorial(form: FormData) {
  const id = String(form.get("id"));
  const alumnoId = String(form.get("alumno_id"));
  const supabase = await createClient();
  const { data, error } = await supabase.from("historial").delete().eq("id", id).select("id");
  if (error) throw new Error(error.message);
  if (!data?.length) throw new Error(SIN_PERMISO);
  revalidatePath(`/alumno/${alumnoId}`);
}

// ─── Administración (solo Orientación; la base de datos lo impide a cualquier otro perfil) ───

function volverAdmin(seccion: string, clave: "ok" | "error", mensaje: string, extra = ""): never {
  revalidatePath("/", "layout");
  redirect(`/admin?seccion=${seccion}&${clave}=${encodeURIComponent(mensaje)}${extra}`);
}

export async function sincronizar() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("sincronizar_con_control_banos");
  if (error) volverAdmin("cursos", "error", error.message);
  const r = data as { curso: string; grupos: number; matriculas: number; sin_grupo: string[] };
  volverAdmin(
    "cursos",
    "ok",
    `Curso ${r.curso}: ${r.grupos} grupos actualizados y ${r.matriculas} alumnos en seguimiento colocados en su grupo.`,
    r.sin_grupo.length ? `&sin=${encodeURIComponent(r.sin_grupo.join("; "))}` : "",
  );
}

export async function activarCurso(form: FormData) {
  const id = Number(form.get("id"));
  const supabase = await createClient();
  await supabase.from("curso_academico").update({ activo: false }).eq("activo", true).neq("id", id);
  const { data, error } = await supabase.from("curso_academico").update({ activo: true }).eq("id", id).select("nombre");
  if (error || !data?.length) volverAdmin("cursos", "error", error?.message ?? SIN_PERMISO);
  volverAdmin("cursos", "ok", `Curso activo: ${data[0].nombre}. Los tutores solo editan las fichas de este curso.`);
}

export async function asignarTutor(form: FormData) {
  const grupoId = String(form.get("grupo_id"));
  const tutorId = texto(form, "tutor_id");
  const supabase = await createClient();
  const { data, error } = await supabase.from("grupo").update({ tutor_id: tutorId }).eq("id", grupoId).select("id");
  if (error || !data?.length) volverAdmin("cursos", "error", error?.message ?? SIN_PERMISO);
  volverAdmin("cursos", "ok", "Tutor/a actualizado.");
}

export async function guardarPersona(form: FormData) {
  const id = texto(form, "id");
  const email = texto(form, "email")?.toLowerCase();
  const nombre = texto(form, "nombre");
  if (!email || !nombre) volverAdmin("perfiles", "error", "El nombre y el email son obligatorios.");
  if (!/@salesian[ae]s\.org$/.test(email)) volverAdmin("perfiles", "error", "El email debe ser @salesianas.org (o @salesianes.org).");

  const fila = {
    email,
    nombre,
    nombre_seneca: texto(form, "nombre_seneca"),
    rol: form.get("rol") === "orientacion" ? "orientacion" : "docente",
    activo: id ? form.get("activo") === "on" : true,
  };
  const supabase = await createClient();
  const { data: yo } = await supabase.auth.getUser();
  if (id && yo.user?.email?.toLowerCase() === email && (fila.rol !== "orientacion" || !fila.activo)) {
    volverAdmin("perfiles", "error", "No puedes quitarte a ti misma/o el perfil de Orientación.");
  }

  const { data, error } = id
    ? await supabase.from("personal").update(fila).eq("id", id).select("id")
    : await supabase.from("personal").insert(fila).select("id");
  if (error) volverAdmin("perfiles", "error", error.code === "23505" ? "Ya existe una persona con ese email." : error.message);
  if (!data?.length) volverAdmin("perfiles", "error", SIN_PERMISO);
  volverAdmin("perfiles", "ok", `${nombre}: guardado.`);
}

export async function borrarPersona(form: FormData) {
  const id = String(form.get("id"));
  const supabase = await createClient();
  const { data: yo } = await supabase.auth.getUser();
  const { data: persona } = await supabase.from("personal").select("email, nombre").eq("id", id).maybeSingle();
  if (persona?.email?.toLowerCase() === yo.user?.email?.toLowerCase()) volverAdmin("perfiles", "error", "No puedes borrar tu propio perfil.");
  const { data, error } = await supabase.from("personal").delete().eq("id", id).select("id");
  if (error || !data?.length) volverAdmin("perfiles", "error", error?.message ?? SIN_PERMISO);
  volverAdmin("perfiles", "ok", `${persona?.nombre ?? "Perfil"} eliminado. Si era tutor/a, su grupo queda sin tutor asignado.`);
}
