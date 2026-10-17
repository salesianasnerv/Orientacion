"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BLOQUES, TIPOS_NEAE, type Medida } from "@/lib/datos";
import type { FilaAlumno } from "@/lib/consultas";

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function Buscador({ filas, medidas, cursoId }: { filas: FilaAlumno[]; medidas: Medida[]; cursoId: number }) {
  const [texto, setTexto] = useState("");
  const [grupo, setGrupo] = useState("");
  const [tipo, setTipo] = useState("");
  const [seneca, setSeneca] = useState("");
  const [medida, setMedida] = useState("");

  const medidaDe = useMemo(() => new Map(medidas.map((m) => [m.id, m])), [medidas]);
  const niveles = useMemo(() => [...new Set(filas.map((f) => f.grupo.replace(/ [A-Z]$/, "")))].filter((n) => n !== "—"), [filas]);
  const grupos = useMemo(() => [...new Set(filas.map((f) => f.grupo))].filter((g) => g !== "—"), [filas]);

  const visibles = useMemo(() => {
    const t = norm(texto.trim());
    return filas.filter((f) => {
      if (t && !norm(`${f.apellidos} ${f.nombre} ${f.nombre} ${f.apellidos} ${f.diagnostico ?? ""}`).includes(t)) return false;
      if (grupo && !(f.grupo === grupo || f.grupo.startsWith(grupo + " "))) return false;
      if (tipo === "-" ? f.tipo : tipo && f.tipo !== tipo) return false;
      if (seneca === "censado" && f.censado !== true) return false;
      if (seneca === "sin" && f.censado !== false) return false;
      if (seneca === "dictamen" && !f.dictamen) return false;
      if (medida.startsWith("b:") ? !f.medidas.some((id) => medidaDe.get(id)?.bloque === medida.slice(2)) : medida && !f.medidas.includes(Number(medida))) return false;
      return true;
    });
  }, [filas, texto, grupo, tipo, seneca, medida, medidaDe]);

  const hayFiltros = texto || grupo || tipo || seneca || medida;
  const limpiar = () => { setTexto(""); setGrupo(""); setTipo(""); setSeneca(""); setMedida(""); };

  return (
    <section className="panel">
      <div className="filtros-bd">
        <label className="campo ancho">
          Buscar alumno/a
          <input type="search" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Nombre, apellidos o diagnóstico (p. ej. «dislexia»)" autoFocus />
        </label>
        <label className="campo">
          Curso / grupo
          <select value={grupo} onChange={(e) => setGrupo(e.target.value)}>
            <option value="">Todos</option>
            {niveles.map((n) => (
              <optgroup key={n} label={n}>
                <option value={n}>{n} (todos)</option>
                {grupos.filter((g) => g.startsWith(n + " ")).map((g) => <option key={g} value={g}>{g}</option>)}
              </optgroup>
            ))}
          </select>
        </label>
        <label className="campo">
          Tipo de NEAE
          <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="">Todos</option>
            {Object.entries(TIPOS_NEAE).map(([k, v]) => <option key={k} value={k}>{k} · {v}</option>)}
            <option value="-">Sin tipo indicado</option>
          </select>
        </label>
        <label className="campo">
          Séneca
          <select value={seneca} onChange={(e) => setSeneca(e.target.value)}>
            <option value="">Todos</option>
            <option value="censado">Censado</option>
            <option value="sin">Sin censar</option>
            <option value="dictamen">Con dictamen</option>
          </select>
        </label>
        <label className="campo ancho-2">
          Medida
          <select value={medida} onChange={(e) => setMedida(e.target.value)}>
            <option value="">Todas</option>
            {BLOQUES.map((b) => (
              <optgroup key={b.clave} label={b.titulo}>
                <option value={`b:${b.clave}`}>Cualquiera de {b.titulo.toLowerCase()}</option>
                {medidas.filter((m) => m.bloque === b.clave).map((m) => (
                  <option key={m.id} value={m.id}>{m.codigo ? `${m.codigo} · ` : ""}{m.nombre}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
      </div>

      <div className="barra" style={{ marginTop: 12 }}>
        <strong>{visibles.length} de {filas.length} alumnos/as</strong>
        {hayFiltros && <button type="button" className="btn mini" onClick={limpiar}>Quitar filtros</button>}
      </div>

      {visibles.length === 0 ? (
        <p className="vacio">Ningún alumno/a cumple estos filtros.</p>
      ) : (
        <div className="tabla-wrap">
          <table className="datos tabla-bd">
            <thead>
              <tr><th>Alumno/a</th><th>Grupo</th><th>NEAE</th><th>Séneca</th><th>Medidas</th><th>Diagnóstico</th></tr>
            </thead>
            <tbody>
              {visibles.map((f) => (
                <tr key={f.id}>
                  <td><Link href={`/alumno/${f.id}?curso=${cursoId}`} className="enlace-fila">{f.apellidos}, {f.nombre}</Link></td>
                  <td className="nowrap">{f.grupo}</td>
                  <td>{f.tipo ? <span className="chip verde" title={TIPOS_NEAE[f.tipo]}>{f.tipo}</span> : <span className="muted">—</span>}{f.dictamen && <span className="chip morado" style={{ marginLeft: 4 }}>Dict.</span>}</td>
                  <td>{f.censado === null ? <span className="chip">Sin ficha</span> : f.censado ? <span className="chip azul">Censado</span> : <span className="chip naranja">Sin censar</span>}</td>
                  <td><ResumenMedidas ids={f.medidas} medidaDe={medidaDe} /></td>
                  <td className="muted small diag">{f.diagnostico?.split("\n").filter(Boolean).slice(0, 2).join(" · ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// Códigos (AP2, PT/PE, PF…) y, para las medidas sin código, cuántas hay de cada bloque (MET ×3)
function ResumenMedidas({ ids, medidaDe }: { ids: number[]; medidaDe: Map<number, Medida> }) {
  if (!ids.length) return <span className="muted">—</span>;
  const lista = ids.map((id) => medidaDe.get(id)).filter((m): m is Medida => !!m);
  const codigos = lista.filter((m) => m.codigo).sort((a, b) => a.bloque.localeCompare(b.bloque));
  const sinCodigo = BLOQUES.map((b) => ({ b, n: lista.filter((m) => !m.codigo && m.bloque === b.clave).length })).filter((x) => x.n);
  return (
    <div className="chips">
      {codigos.map((m) => <span key={m.id} className={`chip ${m.bloque === "especifica" || m.bloque === "programa" ? "naranja" : "azul"}`} title={m.nombre}>{m.codigo}</span>)}
      {sinCodigo.map(({ b, n }) => <span key={b.clave} className="chip" title={b.titulo}>{b.abrev} ×{n}</span>)}
    </div>
  );
}
