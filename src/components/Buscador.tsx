"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BLOQUES, GRUPOS_DE_BLOQUES, TIPOS_NEAE, type Medida } from "@/lib/datos";
import type { FilaAlumno } from "@/lib/consultas";

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function Buscador({ filas, medidas, cursoId }: { filas: FilaAlumno[]; medidas: Medida[]; cursoId: number }) {
  const [texto, setTexto] = useState("");
  const [grupo, setGrupo] = useState("");
  const [repetidor, setRepetidor] = useState("");
  const [pendientes, setPendientes] = useState("");
  const [tipo, setTipo] = useState("");
  const [seneca, setSeneca] = useState("");
  const [medidaGen, setMedidaGen] = useState("");
  const [medidaEsp, setMedidaEsp] = useState("");
  const [abierto, setAbierto] = useState(false);

  const medidaDe = useMemo(() => new Map(medidas.map((m) => [m.id, m])), [medidas]);
  const niveles = useMemo(() => [...new Set(filas.map((f) => f.grupo.replace(/ [A-Z]$/, "")))].filter((n) => n !== "—"), [filas]);
  const grupos = useMemo(() => [...new Set(filas.map((f) => f.grupo))].filter((g) => g !== "—"), [filas]);

  const visibles = useMemo(() => {
    const t = norm(texto.trim());
    return filas.filter((f) => {
      if (t && !norm(`${f.apellidos} ${f.nombre} ${f.nombre} ${f.apellidos} ${f.diagnostico ?? ""}`).includes(t)) return false;
      if (grupo && !(f.grupo === grupo || f.grupo.startsWith(grupo + " "))) return false;
      if (repetidor && f.repetidor !== (repetidor === "si")) return false;
      if (pendientes && f.pendientes > 0 !== (pendientes === "si")) return false;
      if (tipo === "-" ? f.tipo : tipo && f.tipo !== tipo) return false;
      if (seneca === "censado" && f.censado !== true) return false;
      if (seneca === "sin" && f.censado !== false) return false;
      if (seneca === "dictamen" && !f.dictamen) return false;
      if (!cumpleMedida(f.medidas, medidaGen, medidaDe)) return false;
      if (!cumpleMedida(f.medidas, medidaEsp, medidaDe)) return false;
      return true;
    });
  }, [filas, texto, grupo, repetidor, pendientes, tipo, seneca, medidaGen, medidaEsp, medidaDe]);

  const hayFiltros = !!(texto || grupo || repetidor || pendientes || tipo || seneca || medidaGen || medidaEsp);
  const limpiar = () => { setTexto(""); setGrupo(""); setRepetidor(""); setPendientes(""); setTipo(""); setSeneca(""); setMedidaGen(""); setMedidaEsp(""); };
  // Al filtrar se abre el listado; sin filtros queda como estaba
  const filtra = <T,>(set: (v: T) => void) => (v: T) => { set(v); setAbierto(true); };

  return (
    <section className="panel">
      <div className="filtros-bd">
        <div className="filtros-fila f-buscar">
          <label className="campo">
            Buscar alumno/a
            <input type="search" value={texto} onChange={(e) => filtra(setTexto)(e.target.value)} placeholder="Nombre, apellidos o diagnóstico (p. ej. «dislexia»)" autoFocus />
          </label>
          <label className="campo">
            Curso / grupo
            <select value={grupo} onChange={(e) => filtra(setGrupo)(e.target.value)}>
              <option value="">Todos</option>
              {niveles.map((n) => (
                <optgroup key={n} label={n}>
                  <option value={n}>{n} (todos)</option>
                  {grupos.filter((g) => g.startsWith(n + " ")).map((g) => <option key={g} value={g}>{g}</option>)}
                </optgroup>
              ))}
            </select>
          </label>
        </div>
        <div className="filtros-fila f-cuatro">
          <label className="campo">
            Repetidor/a
            <select value={repetidor} onChange={(e) => filtra(setRepetidor)(e.target.value)}>
              <option value="">Todos</option>
              <option value="si">Sí</option>
              <option value="no">No</option>
            </select>
          </label>
          <label className="campo">
            Materias pendientes
            <select value={pendientes} onChange={(e) => filtra(setPendientes)(e.target.value)}>
              <option value="">Todos</option>
              <option value="si">Con pendientes</option>
              <option value="no">Sin pendientes</option>
            </select>
          </label>
          <label className="campo">
            Tipo de NEAE
            <select value={tipo} onChange={(e) => filtra(setTipo)(e.target.value)}>
              <option value="">Todos</option>
              {Object.entries(TIPOS_NEAE).map(([k, v]) => <option key={k} value={k}>{k} · {v}</option>)}
              <option value="-">Sin tipo indicado</option>
            </select>
          </label>
          <label className="campo">
            Séneca
            <select value={seneca} onChange={(e) => filtra(setSeneca)(e.target.value)}>
              <option value="">Todos</option>
              <option value="censado">Censado</option>
              <option value="sin">Sin censar</option>
              <option value="dictamen">Con dictamen</option>
            </select>
          </label>
        </div>
        <div className="filtros-fila f-dos">
          <label className="campo">
            Medidas generales
            <SelectorMedida value={medidaGen} onChange={filtra(setMedidaGen)} medidas={medidas} bloques={GRUPOS_DE_BLOQUES[0].bloques} />
          </label>
          <label className="campo">
            Medidas específicas
            <SelectorMedida value={medidaEsp} onChange={filtra(setMedidaEsp)} medidas={medidas} bloques={GRUPOS_DE_BLOQUES[1].bloques} />
          </label>
        </div>
      </div>

      <details className="listado-bd" open={abierto} onToggle={(e) => setAbierto(e.currentTarget.open)}>
        <summary>
          <span>Listado del alumnado</span>
          <span className="chip azul">{hayFiltros ? `${visibles.length} de ${filas.length}` : filas.length} alumnos/as</span>
          {hayFiltros && <button type="button" className="btn mini" onClick={(e) => { e.preventDefault(); limpiar(); }}>Quitar filtros</button>}
          <span className="flechita" />
        </summary>

        {visibles.length === 0 ? (
          <p className="vacio">Ningún alumno/a cumple estos filtros.</p>
        ) : (
          <div className="tabla-wrap">
            <table className="datos tabla-bd">
              <thead>
                <tr><th>Alumno/a</th><th>Grupo</th><th>NEAE</th><th>Séneca</th><th>Medidas generales</th><th>Medidas específicas</th><th>Diagnóstico</th></tr>
              </thead>
              <tbody>
                {visibles.map((f) => (
                  <tr key={f.id}>
                    <td>
                      <Link href={`/alumno/${f.id}?curso=${cursoId}`} className="enlace-fila">{f.apellidos}, {f.nombre}</Link>
                      {(f.repetidor || f.pendientes > 0) && (
                        <div className="marcas">
                          {f.repetidor && <span className="chip rojo">Repetidor/a</span>}
                          {f.pendientes > 0 && <span className="chip naranja">{f.pendientes} pendiente{f.pendientes > 1 ? "s" : ""}</span>}
                        </div>
                      )}
                    </td>
                    <td className="nowrap">{f.grupo}</td>
                    <td>{f.tipo ? <span className="chip verde" title={TIPOS_NEAE[f.tipo]}>{f.tipo}</span> : <span className="muted">—</span>}{f.dictamen && <span className="chip morado" style={{ marginLeft: 4 }}>Dict.</span>}</td>
                    <td>{f.censado === null ? <span className="chip">Sin ficha</span> : f.censado ? <span className="chip azul">Censado</span> : <span className="chip naranja">Sin censar</span>}</td>
                    {GRUPOS_DE_BLOQUES.map((g, i) => (
                      <td key={g.titulo} className="celda-medidas"><MedidasPlegables ids={f.medidas} medidaDe={medidaDe} bloques={g.bloques} especificas={i === 1} /></td>
                    ))}
                    <td className="muted small diag">{f.diagnostico?.split("\n").filter(Boolean).slice(0, 2).join(" · ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </details>
    </section>
  );
}

// Filtro por medida: "" = todas, "b:<bloque>" = cualquiera del bloque, "<id>" = esa medida
export function cumpleMedida(ids: number[], filtro: string, medidaDe: Map<number, Medida>) {
  if (!filtro) return true;
  if (filtro.startsWith("b:")) return ids.some((id) => medidaDe.get(id)?.bloque === filtro.slice(2));
  return ids.includes(Number(filtro));
}

export function SelectorMedida({ value, onChange, medidas, bloques }: { value: string; onChange: (v: string) => void; medidas: Medida[]; bloques?: Medida["bloque"][] }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Todas</option>
      {BLOQUES.filter((b) => !bloques || bloques.includes(b.clave)).map((b) => (
        <optgroup key={b.clave} label={b.titulo}>
          <option value={`b:${b.clave}`}>Cualquiera de {b.titulo.toLowerCase()}</option>
          {medidas.filter((m) => m.bloque === b.clave).map((m) => (
            <option key={m.id} value={m.id}>{m.codigo ? `${m.codigo} · ` : ""}{m.nombre}</option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}

// Recuento de medidas de un grupo (generales o específicas); al pulsar se despliega la lista por bloques
export function MedidasPlegables({ ids, medidaDe, bloques, especificas }: { ids: number[]; medidaDe: Map<number, Medida>; bloques: Medida["bloque"][]; especificas: boolean }) {
  const lista = ids.map((id) => medidaDe.get(id)).filter((m): m is Medida => !!m && bloques.includes(m.bloque));
  if (!lista.length) return <span className="muted">—</span>;
  const porBloque = BLOQUES.filter((b) => bloques.includes(b.clave))
    .map((b) => ({ b, ms: lista.filter((m) => m.bloque === b.clave).sort((x, y) => x.orden - y.orden) }))
    .filter((x) => x.ms.length);
  return (
    <details className="mini-plegable">
      <summary>
        <span className={`chip ${especificas ? "naranja" : "azul"}`}>{lista.length} {lista.length === 1 ? "medida" : "medidas"}</span>
        <span className="flechita" />
      </summary>
      {porBloque.map(({ b, ms }) => (
        <div key={b.clave} className="bloque-lista">
          {porBloque.length > 1 && <div className="bloque-titulo">{b.titulo}</div>}
          <ul>{ms.map((m) => <li key={m.id}>{m.codigo && <strong>{m.codigo} · </strong>}{m.nombre}</li>)}</ul>
        </div>
      ))}
    </details>
  );
}
