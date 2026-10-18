// Materias y profesorado de la web de Horarios (tablas hor_* del mismo proyecto de Supabase, lectura pública).
import { createClient } from "@/lib/supabase/server";

export type OpcionesPendientes = { niveles: { nivel: string; materias: string[] }[]; profesores: string[] };

const nivelDe = (grupo: string) => grupo.replace(/\s+[A-Z]$/, "").trim(); // '2º ESO B' → '2º ESO'

// Materias que se imparten en cada nivel anterior al actual (no se puede tener pendiente el curso que se cursa)
export async function opcionesPendientes(cursoNombre: string | undefined, nivelActual: { nombre: string; orden: number } | null): Promise<OpcionesPendientes> {
  const supabase = await createClient();
  const { data: cursos } = await supabase.from("hor_cursos").select("id, nombre, activo");
  const anio = cursoNombre?.slice(0, 4);
  const curso = cursos?.find((c) => anio && c.nombre.startsWith(anio)) ?? cursos?.find((c) => c.activo);
  if (!curso) return { niveles: [], profesores: [] };

  const [{ data: grupos }, { data: materias }, { data: ocupaciones }, { data: docentes }] = await Promise.all([
    supabase.from("hor_grupos").select("id, nombre").eq("curso_id", curso.id),
    supabase.from("hor_materias").select("abrev, nombre, niveles").eq("curso_id", curso.id),
    supabase.from("hor_ocupaciones").select("materia, grupos").eq("curso_id", curso.id).eq("tipo", "clase").not("materia", "is", null),
    supabase.from("hor_docentes").select("nombre, activo, orden").eq("curso_id", curso.id).order("orden"),
  ]);

  const nivelGrupo = new Map((grupos ?? []).map((g) => [g.id, nivelDe(g.nombre)]));
  const nombreMateria = (abrev: string, nivel: string) => {
    const ms = (materias ?? []).filter((m) => m.abrev === abrev);
    const m = ms.find((x) => (x.niveles ?? []).includes(nivel)) ?? ms.find((x) => !x.niveles?.length) ?? ms[0];
    return m?.nombre || abrev;
  };

  const porNivel = new Map<string, Set<string>>();
  for (const o of ocupaciones ?? []) {
    for (const g of o.grupos ?? []) {
      const nivel = nivelGrupo.get(g);
      if (!nivel) continue;
      if (!porNivel.has(nivel)) porNivel.set(nivel, new Set());
      porNivel.get(nivel)!.add(nombreMateria(o.materia, nivel));
    }
  }

  // Niveles de la misma etapa con número menor que el actual
  const etapa = nivelActual?.nombre.replace(/^\d+º\s*/, "") ?? "ESO";
  const numero = (n: string) => Number(n.match(/^(\d+)º/)?.[1] ?? 0);
  const actual = nivelActual ? numero(nivelActual.nombre) : 0;
  const niveles = [...porNivel.keys()]
    .filter((n) => n.replace(/^\d+º\s*/, "") === etapa && numero(n) > 0 && numero(n) < actual)
    .sort((a, b) => numero(a) - numero(b))
    .map((nivel) => ({ nivel, materias: [...porNivel.get(nivel)!].sort((a, b) => a.localeCompare(b, "es")) }));

  const profesores = (docentes ?? []).filter((d) => d.activo !== false).map((d) => d.nombre).sort((a, b) => a.localeCompare(b, "es"));
  return { niveles, profesores };
}
