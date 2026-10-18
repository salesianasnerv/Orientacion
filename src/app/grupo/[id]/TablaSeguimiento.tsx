"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { cumpleMedida, MedidasPlegables, SelectorMedida } from "@/components/Buscador";
import { Chip } from "@/components/Marco";
import { GRUPOS_DE_BLOQUES, TIPOS_NEAE, type Medida } from "@/lib/datos";

export type FilaGrupo = {
  id: string;
  nombre: string;
  ficha: { censado: boolean; tipo_neae: string | null; dictamen: boolean; diagnostico: string | null } | null;
  medidas: number[];
};

// Alumnado en seguimiento del grupo, con sus medidas y filtro por medida (p. ej. adaptación de exámenes)
export function TablaSeguimiento({ filas, medidas, cursoId }: { filas: FilaGrupo[]; medidas: Medida[]; cursoId: number }) {
  const [medida, setMedida] = useState("");
  const medidaDe = useMemo(() => new Map(medidas.map((m) => [m.id, m])), [medidas]);
  const visibles = filas.filter((f) => cumpleMedida(f.medidas, medida, medidaDe));

  return (
    <>
      <div className="barra">
        <label className="campo" style={{ minWidth: 280, flex: "0 1 420px" }}>
          Filtrar por medida
          <SelectorMedida value={medida} onChange={setMedida} medidas={medidas} />
        </label>
        {medida && <><strong>{visibles.length} de {filas.length}</strong><button type="button" className="btn mini" onClick={() => setMedida("")}>Quitar filtro</button></>}
      </div>
      {visibles.length === 0 ? (
        <p className="vacio">Nadie en este grupo tiene esa medida.</p>
      ) : (
        <div className="tabla-wrap">
          <table className="datos tabla-bd">
            <thead>
              <tr><th>Alumno/a</th><th>Séneca</th><th>NEAE</th><th>Medidas generales</th><th>Medidas específicas</th><th>Diagnóstico</th></tr>
            </thead>
            <tbody>
              {visibles.map(({ id, nombre, ficha: f, medidas: ids }) => (
                <tr key={id}>
                  <td><Link href={`/alumno/${id}?curso=${cursoId}`} className="enlace-fila">{nombre}</Link></td>
                  <td>{!f ? <Chip>Sin ficha</Chip> : f.censado ? <Chip color="azul">Censado</Chip> : <Chip color="naranja">Sin censar</Chip>}</td>
                  <td title={f?.tipo_neae ? TIPOS_NEAE[f.tipo_neae] : undefined}>
                    <div className="chips">
                      {f?.tipo_neae ? <Chip color="verde">{f.tipo_neae}</Chip> : <span className="muted">—</span>}
                      {f?.dictamen && <Chip color="morado">Dictamen</Chip>}
                    </div>
                  </td>
                  {GRUPOS_DE_BLOQUES.map((g, i) => (
                    <td key={g.titulo} className="celda-medidas"><MedidasPlegables ids={ids} medidaDe={medidaDe} bloques={g.bloques} especificas={i === 1} /></td>
                  ))}
                  <td className="muted small diag">{f?.diagnostico?.split("\n").filter(Boolean).slice(0, 2).join(" · ") ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
