import { BLOQUES, GRUPOS_DE_BLOQUES, nombreCompleto, nombreGrupo, TIPOS_NEAE } from "@/lib/datos";
import { cargarAlumno } from "../cargar";

export type ApartadoMedidas = { titulo: string; items: string[] };

// Lo que se imprime o se descarga en Word de la ficha del alumno/a (un curso)
export type DatosFicha = {
  alumno: string;
  curso: string;
  grupo: string;
  tutor: string;
  repetidor: boolean;
  censado: boolean;
  tipoNeae: string | null;
  dictamen: boolean;
  diagnostico: string | null;
  pendientes: { nivel: string; materia: string; profesor: string | null }[];
  pendientesTexto: string | null; // materias pendientes antiguas (texto libre de la matrícula)
  generales: ApartadoMedidas[];
  especificas: ApartadoMedidas[];
  aspectos: string | null;
  evaluaciones: [string | null, string | null, string | null]; // 1ª, 2ª, ordinaria
  historial: { etiqueta: string; texto: string }[];
};

export async function datosFicha(id: string, cursoParam?: string) {
  const d = await cargarAlumno(id, cursoParam);
  if (!d?.ficha) return null;
  const { alumno, curso, ficha, matricula, grupo, medidas, pendientes, historial } = d;

  // Medidas marcadas, por bloques (Medidas generales, Metodología… / Medidas específicas, Programas)
  const [generales, especificas] = GRUPOS_DE_BLOQUES.map((g) =>
    BLOQUES.filter((b) => g.bloques.includes(b.clave))
      .map((b) => ({
        titulo: b.titulo,
        items: medidas.filter((m) => m.bloque === b.clave).sort((x, y) => x.orden - y.orden).map((m) => `${m.codigo ? `${m.codigo} · ` : ""}${m.nombre}`),
      }))
      .filter((a) => a.items.length),
  );

  const datos: DatosFicha = {
    alumno: nombreCompleto(alumno),
    curso: curso?.nombre ?? "",
    grupo: grupo ? nombreGrupo(grupo) : "Sin grupo",
    tutor: grupo?.tutor?.nombre ?? "Sin asignar",
    repetidor: !!matricula?.repetidor,
    censado: ficha.censado,
    tipoNeae: ficha.tipo_neae ? `${ficha.tipo_neae} · ${TIPOS_NEAE[ficha.tipo_neae] ?? ""}` : null,
    dictamen: ficha.dictamen,
    diagnostico: ficha.diagnostico,
    pendientes,
    pendientesTexto: pendientes.length ? null : (matricula?.materias_pendientes ?? null),
    generales,
    especificas,
    aspectos: ficha.propuesta_medidas,
    evaluaciones: [ficha.eval_medidas_1, ficha.eval_medidas_2, ficha.eval_medidas_ordinaria],
    historial: historial.map((h) => ({ etiqueta: h.etiqueta, texto: h.texto })),
  };
  return { datos, cursoId: curso?.id ?? null, nombreArchivo: `Ficha de orientación - ${nombreCompleto(alumno)} - ${curso?.nombre ?? ""}` };
}
