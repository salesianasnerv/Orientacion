// Documento de seguimiento de atención a la diversidad: rellena las plantillas Word reales
// («Alumnado censado» / «Alumnado sin censar») con los datos de la ficha, sin tocar su formato.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { DOMParser, XMLSerializer } from "@xmldom/xmldom";
import JSZip from "jszip";
import type { Bloque, Medida } from "@/lib/datos";

type Nodo = import("@xmldom/xmldom").Element;

export type Evaluacion = "inicial" | "primera" | "segunda" | "tercera";
const EVALUACIONES: Evaluacion[] = ["inicial", "primera", "segunda", "tercera"];

export type DatosDocumento = {
  censado: boolean;
  alumno: string;
  cursoAcademico: string;
  grupo: string;
  tutor: string;
  tipoNeae: string | null;
  dictamen: boolean;
  materias: string | null;
  pendientes: string | null;
  repetidor: boolean;
  area: string | null;
  profesorReferencia: string | null;
  medidas: Medida[];
  aspectos: string | null; // «Aspectos a tener en cuenta»
  evaluaciones: [string | null, string | null, string | null]; // 1ª, 2ª, ordinaria
  obs: Partial<Record<"metodologia" | "evaluacion" | "prueba_escrita", string | null>>;
  necesidades: { nombre: string; evaluacion: Evaluacion }[];
  valoraciones: { evaluacion: Evaluacion; resultado: "positivo" | "insuficiente" | null; explicacion: string | null }[];
};

const W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";

// `plantilla`: el Word leído de SharePoint; si no llega, la copia guardada en src/plantillas
export async function generarDocumento(d: DatosDocumento, { vista = false, plantilla }: { vista?: boolean; plantilla?: Uint8Array | null } = {}) {
  const archivo = d.censado ? "alumnado-censado.docx" : "alumnado-sin-censar.docx";
  const zip = await JSZip.loadAsync(plantilla ?? (await readFile(path.join(process.cwd(), "src/plantillas", archivo))));
  const xml = (await zip.file("word/document.xml")!.async("string")).replace(/^\uFEFF/, "");
  const doc = new DOMParser().parseFromString(xml, "text/xml");

  if (d.censado) rellenarCensado(doc, d);
  else rellenarSinCensar(doc, d);
  // La vista previa del navegador no dibuja las casillas de formulario de Word: se cambian por ☒ / ☐
  if (vista) casillasComoTexto(doc);

  zip.file("word/document.xml", new XMLSerializer().serializeToString(doc));
  return zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
}

// ───────────────────────── Alumnado sin censar ─────────────────────────

function rellenarSinCensar(doc: Document | import("@xmldom/xmldom").Document, d: DatosDocumento) {
  const body = hijos(doc.documentElement as Nodo, "body")[0];

  const cabecera: [string, string | null][] = [
    ["ALUMNO/A:", d.alumno],
    ["AÑO ESCOLAR:", d.cursoAcademico],
    ["CURSO:", d.grupo],
    ["ÁREA:", d.area],
    ["TUTOR/A:", d.tutor],
    ["PROFESOR/A DE REFERENCIA:", d.profesorReferencia],
  ];
  for (const p of hijos(body, "p")) {
    const t = texto(p).trim();
    const c = cabecera.find(([etq]) => t.startsWith(etq));
    if (c?.[1]) anadirTexto(p, " " + c[1]);
  }

  const bloquesTabla: [string, Bloque[]][] = [
    ["MEDIDAS GENERALES", ["general", "especifica", "programa"]],
    ["METODOLOGIA", ["metodologia"]],
    ["EVALUACION (EV)", ["evaluacion"]],
    ["ADAPTACION DE LAS PRUEBAS ESCRITAS", ["prueba_escrita"]],
  ];
  for (const tbl of hijos(body, "tbl")) {
    const filas = hijos(tbl, "tr");
    const titulo = norm(texto(celdas(filas[0])[0]));

    if (titulo.startsWith("SEGUIMIENTO")) {
      filas.slice(1).forEach((tr, i) => {
        const v = d.valoraciones.find((x) => x.evaluacion === EVALUACIONES[i + 1]);
        const txt = [d.evaluaciones[i], v?.explicacion].filter(Boolean).join("\n");
        if (txt) ponerTexto(celdas(tr)[1], txt);
      });
      continue;
    }

    const bloques = bloquesTabla.find(([t]) => titulo.startsWith(norm(t)))?.[1];
    if (!bloques) continue;
    const delBloque = d.medidas.filter((m) => bloques.includes(m.bloque));
    const usadas = new Set<number>();
    let modelo: Nodo | null = null;
    let otros: Nodo | null = null;

    for (const tr of filas.slice(1)) {
      const [c1, c2] = celdas(tr);
      const t = norm(texto(c1));
      if (t.startsWith("OTROS")) { otros ??= tr; continue; }
      if (t.startsWith("OBSERVACIONES")) {
        const obs = bloques[0] === "metodologia" ? [d.aspectos, d.obs.metodologia].filter(Boolean).join("\n") : d.obs[bloques[0] as "evaluacion" | "prueba_escrita"];
        if (obs) anadirParrafo(c1, obs);
        continue;
      }
      modelo ??= tr;
      const m = delBloque.find((x) => !usadas.has(x.id) && coincide(texto(c1), x));
      if (m && c2) { usadas.add(m.id); ponerTexto(c2, "X", true); }
    }

    // Medidas marcadas que no tienen fila en la plantilla: se añade una fila con el mismo formato
    for (const m of delBloque.filter((x) => !usadas.has(x.id))) {
      if (!modelo) break;
      const nueva = modelo.cloneNode(true) as Nodo;
      const [c1, c2] = celdas(nueva);
      ponerTexto(c1, m.codigo ? `${m.nombre} (${m.codigo})` : m.nombre);
      if (c2) ponerTexto(c2, "X", true);
      tbl.insertBefore(nueva, otros ?? null);
    }
  }
}

// Fila de la plantilla ↔ medida: por el código entre paréntesis o por el comienzo del nombre
function coincide(fila: string, m: Medida) {
  const cod = fila.match(/\(([A-Z0-9/ ]+)\)\s*$/)?.[1];
  if (cod && m.codigo) return clave(cod) === clave(m.codigo) || (clave(cod) === "AB" && m.codigo === "ABS");
  const a = norm(fila), b = norm(m.nombre);
  const n = Math.min(40, a.length, b.length);
  return n > 8 && a.slice(0, n) === b.slice(0, n);
}

// ───────────────────────── Alumnado censado ─────────────────────────

function rellenarCensado(doc: Document | import("@xmldom/xmldom").Document, d: DatosDocumento) {
  const body = hijos(doc.documentElement as Nodo, "body")[0];
  const codigos = new Set(d.medidas.map((m) => m.codigo && clave(m.codigo)).filter(Boolean));
  const neae = [d.tipoNeae, d.dictamen ? "Dictamen" : null].filter(Boolean).join(" · ");
  const datos: Record<string, string | null> = {
    "ALUMNO/A": d.alumno,
    CURSO: d.grupo,
    "TUTOR/A": d.tutor,
    MATERIAS: d.materias,
    PENDIENTES: d.pendientes,
    REPETIDOR: d.repetidor ? "Sí" : "No",
    NEAE: neae || null,
    PT: codigos.has("PTPE") ? "Sí" : "No",
  };
  // Se marca la evaluación inicial y cada evaluación que ya tiene valoración
  const evaluada = (i: number) => i === 0 || !!d.evaluaciones[i - 1] || d.valoraciones.some((v) => v.evaluacion === EVALUACIONES[i] && (v.resultado || v.explicacion));

  for (const tbl of hijos(body, "tbl")) {
    const filas = hijos(tbl, "tr");
    const titulo = norm(texto(celdas(filas[0])[0]));

    if (titulo === "ALUMNO/A") {
      for (const tr of filas) {
        const cs = celdas(tr);
        for (let i = 0; i + 1 < cs.length; i += 2) {
          const v = datos[norm(texto(cs[i]))];
          if (v) ponerTexto(cs[i + 1], v);
        }
      }
    } else if (titulo === "EVALUACION INICIAL") {
      for (const tr of filas) {
        const cs = celdas(tr);
        const casillas = cs.map(casillasDe);
        if (!casillas.some((c) => c.length)) continue;
        cs.forEach((_, i) => {
          for (const c of casillas[i]) {
            const et = clave(c.etiqueta);
            if (cs.length > 4) {
              // Medidas: 3 celdas (generales / específicas / programas) por evaluación
              const cod = et === "EVPSIC" ? "EVPS" : et;
              if (evaluada(Math.floor(i / 3)) && codigos.has(cod)) marcar(c.casilla);
            } else if (et === "POSITIVO" || et === "INSUFICIENTE") {
              const v = d.valoraciones.find((x) => x.evaluacion === EVALUACIONES[i]);
              if (v?.resultado && clave(v.resultado) === et) marcar(c.casilla);
            } else if (d.necesidades.some((n) => n.evaluacion === EVALUACIONES[i] && mismaNecesidad(n.nombre, c.etiqueta))) {
              marcar(c.casilla);
            }
          }
        });
      }
    } else if (titulo.startsWith("EXPLICACION DE LAS MEDIDAS")) {
      const cs = celdas(filas[2] ?? filas[filas.length - 1]);
      cs.forEach((tc, i) => {
        const v = d.valoraciones.find((x) => x.evaluacion === EVALUACIONES[i + 1]);
        const partes = [i === 0 ? d.aspectos : null, d.evaluaciones[i], v?.explicacion].filter(Boolean);
        if (partes.length) ponerTexto(tc, partes.join("\n\n"));
      });
    }
  }
}

function mismaNecesidad(nombre: string, etiqueta: string) {
  const a = norm(nombre), b = norm(etiqueta).replace(/:$/, "");
  const n = Math.min(14, a.length, b.length);
  return a.slice(0, n) === b.slice(0, n);
}

// Casillas de formulario (FORMCHECKBOX) de una celda, con el texto que las sigue
function casillasDe(tc: Nodo) {
  const out: { casilla: Nodo; etiqueta: string }[] = [];
  const recorrer = (n: Nodo) => {
    for (let h = n.firstChild as Nodo | null; h; h = h.nextSibling as Nodo | null) {
      if (h.nodeType !== 1) continue;
      if (h.namespaceURI === W && h.localName === "checkBox") out.push({ casilla: h, etiqueta: "" });
      else if (h.namespaceURI === W && h.localName === "t") { if (out.length) out[out.length - 1].etiqueta += h.textContent ?? ""; }
      else recorrer(h);
    }
  };
  recorrer(tc);
  return out;
}

function marcar(checkBox: Nodo) {
  let def = hijos(checkBox, "default")[0];
  if (!def) { def = checkBox.ownerDocument!.createElementNS(W, "w:default"); checkBox.appendChild(def); }
  def.setAttributeNS(W, "w:val", "1");
}

function casillasComoTexto(doc: Document | import("@xmldom/xmldom").Document) {
  const lista = Array.from((doc as unknown as Nodo).getElementsByTagNameNS(W, "checkBox"));
  for (const cb of lista) {
    const marcada = hijos(cb, "default")[0]?.getAttributeNS(W, "val") === "1" || hijos(cb, "default")[0]?.getAttribute("w:val") === "1";
    let r = cb.parentNode!.parentNode!.parentNode as Nodo; // checkBox › ffData › fldChar › r
    const p = r.parentNode as Nodo;
    const rPr = hijos(r, "rPr")[0]?.cloneNode(true) as Nodo | undefined;
    // Quita el campo completo (begin … end) y deja el símbolo
    const simbolo = nuevoRun(doc as unknown as Nodo, marcada ? "☒" : "☐", rPr);
    p.insertBefore(simbolo, r);
    while (r) {
      const sig = r.nextSibling as Nodo | null;
      const fin = hijos(r, "fldChar").some((f) => (f.getAttributeNS(W, "fldCharType") ?? f.getAttribute("w:fldCharType")) === "end");
      p.removeChild(r);
      if (fin || !sig) break;
      r = sig;
    }
  }
}

// ───────────────────────── Utilidades XML ─────────────────────────

function hijos(n: Nodo, nombre: string): Nodo[] {
  const out: Nodo[] = [];
  for (let h = n.firstChild as Nodo | null; h; h = h.nextSibling as Nodo | null) {
    if (h.nodeType === 1 && h.namespaceURI === W && h.localName === nombre) out.push(h);
  }
  return out;
}

function celdas(tr: Nodo) {
  return hijos(tr, "tc");
}

function texto(n: Nodo | undefined) {
  if (!n) return "";
  return Array.from(n.getElementsByTagNameNS(W, "t")).map((t) => t.textContent ?? "").join("");
}

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().replace(/\s+/g, " ").trim();
const clave = (s: string) => norm(s).replace(/[^A-Z0-9]/g, "");

// Formato del texto nuevo: el de la marca de párrafo, sin negrita
function formatoDe(p: Nodo) {
  const base = hijos(hijos(p, "pPr")[0] ?? p, "rPr")[0];
  const rPr = base?.cloneNode(true) as Nodo | undefined;
  if (rPr) for (const b of [...hijos(rPr, "b"), ...hijos(rPr, "bCs")]) rPr.removeChild(b);
  return rPr;
}

function nuevoRun(doc: Nodo | import("@xmldom/xmldom").Document, txt: string, rPr?: Nodo) {
  const owner = ("ownerDocument" in doc && doc.ownerDocument ? doc.ownerDocument : doc) as import("@xmldom/xmldom").Document;
  const r = owner.createElementNS(W, "w:r");
  if (rPr) r.appendChild(rPr.cloneNode(true));
  txt.split("\n").forEach((linea, i) => {
    if (i) r.appendChild(owner.createElementNS(W, "w:br"));
    const t = owner.createElementNS(W, "w:t");
    t.setAttribute("xml:space", "preserve");
    t.appendChild(owner.createTextNode(linea));
    r.appendChild(t);
  });
  return r;
}

function anadirTexto(p: Nodo, txt: string) {
  p.appendChild(nuevoRun(p, txt, formatoDe(p)));
}

// Sustituye el contenido de una celda (deja el primer párrafo con su formato)
function ponerTexto(tc: Nodo, txt: string, centrado = false) {
  const [p, ...resto] = hijos(tc, "p");
  for (const x of resto) tc.removeChild(x);
  for (const r of [...hijos(p, "r"), ...hijos(p, "hyperlink")]) p.removeChild(r);
  if (centrado) {
    let pPr = hijos(p, "pPr")[0];
    if (!pPr) { pPr = p.ownerDocument!.createElementNS(W, "w:pPr"); p.insertBefore(pPr, p.firstChild); }
    for (const jc of hijos(pPr, "jc")) pPr.removeChild(jc);
    const jc = p.ownerDocument!.createElementNS(W, "w:jc");
    jc.setAttribute("w:val", "center");
    const rPr = hijos(pPr, "rPr")[0];
    pPr.insertBefore(jc, rPr ?? null);
  }
  anadirTexto(p, txt);
}

// Añade un párrafo nuevo al final de una celda con el formato del primero
function anadirParrafo(tc: Nodo, txt: string) {
  const p0 = hijos(tc, "p")[0];
  const p = p0.cloneNode(false) as Nodo;
  const pPr = hijos(p0, "pPr")[0];
  if (pPr) p.appendChild(pPr.cloneNode(true));
  tc.appendChild(p);
  anadirTexto(p, txt);
}
