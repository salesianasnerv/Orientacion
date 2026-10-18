"use client";

import { useState } from "react";
import type { OpcionesPendientes } from "@/lib/horarios";

type Fila = { nivel: string; materia: string; profesor: string };

// Filas de materias pendientes: curso → materia (de ese curso) → profesor/a que hace el seguimiento
export function Pendientes({ opciones, iniciales }: { opciones: OpcionesPendientes; iniciales: Fila[] }) {
  const [filas, setFilas] = useState<Fila[]>(iniciales);
  const cambiar = (i: number, cambio: Partial<Fila>) => setFilas((fs) => fs.map((f, j) => (j === i ? { ...f, ...cambio } : f)));

  if (!opciones.niveles.length && !filas.length) {
    return <p className="muted small">En el primer curso de la etapa no puede haber materias pendientes.</p>;
  }

  return (
    <div className="pendientes">
      {filas.map((f, i) => {
        const materias = opciones.niveles.find((n) => n.nivel === f.nivel)?.materias ?? [];
        return (
          <div key={i} className="fila-pendiente">
            <label className="campo">
              Curso
              <select name="pend_nivel" value={f.nivel} onChange={(e) => cambiar(i, { nivel: e.target.value, materia: "" })} required>
                <option value="">—</option>
                {opciones.niveles.map((n) => <option key={n.nivel} value={n.nivel}>{n.nivel}</option>)}
                {f.nivel && !opciones.niveles.some((n) => n.nivel === f.nivel) && <option value={f.nivel}>{f.nivel}</option>}
              </select>
            </label>
            <label className="campo">
              Materia
              <select name="pend_materia" value={f.materia} onChange={(e) => cambiar(i, { materia: e.target.value })} required>
                <option value="">—</option>
                {materias.map((m) => <option key={m} value={m}>{m}</option>)}
                {f.materia && !materias.includes(f.materia) && <option value={f.materia}>{f.materia}</option>}
              </select>
            </label>
            <label className="campo">
              Profesor/a de seguimiento
              <select name="pend_profesor" value={f.profesor} onChange={(e) => cambiar(i, { profesor: e.target.value })}>
                <option value="">— Sin asignar —</option>
                {opciones.profesores.map((p) => <option key={p} value={p}>{p}</option>)}
                {f.profesor && !opciones.profesores.includes(f.profesor) && <option value={f.profesor}>{f.profesor}</option>}
              </select>
            </label>
            <button type="button" className="btn mini peligro" onClick={() => setFilas((fs) => fs.filter((_, j) => j !== i))}>Quitar</button>
          </div>
        );
      })}
      {opciones.niveles.length > 0 && (
        <button type="button" className="btn mini" onClick={() => setFilas((fs) => [...fs, { nivel: opciones.niveles.at(-1)!.nivel, materia: "", profesor: "" }])}>
          + Añadir materia pendiente
        </button>
      )}
    </div>
  );
}
