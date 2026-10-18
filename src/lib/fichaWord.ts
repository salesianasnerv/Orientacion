// Ficha del alumno/a en Word sobre la hoja corporativa vertical del colegio (cabecera, pie y márgenes de la hoja).
// Se sustituye el cuerpo vacío de la hoja por el contenido; el resto del archivo no se toca.
import { readFile } from "node:fs/promises";
import path from "node:path";
import JSZip from "jszip";
import type { DatosFicha } from "@/app/alumno/[id]/ficha/datos";

const VERDE = "8A9400", VERDE_BG = "EEF1C7", AZUL = "009ABB", NARANJA = "EE712A", GRIS = "5F6368", BORDE = "C9CCA0";
const FUENTE = '<w:rFonts w:ascii="Arial Narrow" w:hAnsi="Arial Narrow" w:cs="Arial"/>';
const ANCHO = 8504; // ancho útil de la hoja (A4 con márgenes de 3 cm), en twips

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Texto → <w:r> (los saltos de línea se respetan)
function run(texto: string, { b = false, i = false, color = "", sz = 21 } = {}) {
  const rpr = `<w:rPr>${FUENTE}${b ? "<w:b/>" : ""}${i ? "<w:i/>" : ""}${color ? `<w:color w:val="${color}"/>` : ""}<w:sz w:val="${sz}"/><w:szCs w:val="${sz}"/></w:rPr>`;
  return texto.split("\n").map((t, k) => `<w:r>${rpr}${k ? "<w:br/>" : ""}<w:t xml:space="preserve">${esc(t)}</w:t></w:r>`).join("");
}
const vacio = () => run("—", { color: GRIS });

function parrafo(runs: string, { antes = 0, despues = 80, jc = "", borde = "", sangria = 0, conSiguiente = false } = {}) {
  return (
    `<w:p><w:pPr>${conSiguiente ? "<w:keepNext/>" : ""}` +
    (borde ? `<w:pBdr><w:bottom w:val="single" w:sz="12" w:space="2" w:color="${borde}"/></w:pBdr>` : "") +
    `<w:spacing w:before="${antes}" w:after="${despues}" w:line="264" w:lineRule="auto"/>` +
    (sangria ? `<w:ind w:left="${sangria}" w:hanging="200"/>` : "") +
    (jc ? `<w:jc w:val="${jc}"/>` : "") +
    `</w:pPr>${runs}</w:p>`
  );
}
const titulo = (t: string, color = VERDE) => parrafo(run(t.toUpperCase(), { b: true, color, sz: 24 }), { antes: 280, despues: 120, borde: color, conSiguiente: true });
const subtitulo = (t: string) => parrafo(run(t, { b: true, color: GRIS }), { antes: 120, despues: 40, conSiguiente: true });
const textoLargo = (t: string | null) => (t?.trim() ? t.trim().split(/\n+/).map((x) => parrafo(run(x), { jc: "both" })).join("") : parrafo(vacio()));
const vineta = (t: string) => parrafo(run("•  ", { b: true, color: VERDE }) + run(t), { sangria: 300, despues: 40 });

function celda(runs: string, ancho: number, fondo = "") {
  return `<w:tc><w:tcPr><w:tcW w:w="${ancho}" w:type="dxa"/>${fondo ? `<w:shd w:val="clear" w:color="auto" w:fill="${fondo}"/>` : ""}<w:tcMar><w:top w:w="50" w:type="dxa"/><w:bottom w:w="50" w:type="dxa"/></w:tcMar><w:vAlign w:val="center"/></w:tcPr>${parrafo(runs, { despues: 0 })}</w:tc>`;
}
function tabla(filas: string[], anchos: number[]) {
  const bordes = ["top", "left", "bottom", "right", "insideH", "insideV"].map((b) => `<w:${b} w:val="single" w:sz="4" w:space="0" w:color="${BORDE}"/>`).join("");
  return (
    `<w:tbl><w:tblPr><w:tblW w:w="${ANCHO}" w:type="dxa"/><w:tblBorders>${bordes}</w:tblBorders><w:tblLayout w:type="fixed"/>` +
    `<w:tblCellMar><w:left w:w="100" w:type="dxa"/><w:right w:w="100" w:type="dxa"/></w:tblCellMar></w:tblPr>` +
    `<w:tblGrid>${anchos.map((a) => `<w:gridCol w:w="${a}"/>`).join("")}</w:tblGrid>${filas.join("")}</w:tbl>`
  );
}
// Tabla con cabecera azul (se repite si salta de página)
function tablaConCabecera(cabecera: string[], filas: string[][], anchos: number[]) {
  const cab = `<w:tr><w:trPr><w:tblHeader/></w:trPr>${cabecera.map((c, k) => celda(run(c, { b: true, color: "FFFFFF" }), anchos[k], AZUL)).join("")}</w:tr>`;
  return tabla([cab, ...filas.map((f) => `<w:tr><w:trPr><w:cantSplit/></w:trPr>${f.map((c, k) => celda(c, anchos[k])).join("")}</w:tr>`)], anchos);
}
// Datos: etiqueta (fondo verde claro) + valor, dos parejas por fila
function tablaDatos(pares: [string, string][]) {
  const anchos = [1350, 2902, 1350, 2902];
  const filas: string[] = [];
  for (let k = 0; k < pares.length; k += 2) {
    const celdas = [pares[k], pares[k + 1]].flatMap((par, n) => [
      celda(par ? run(par[0], { b: true, color: VERDE, sz: 19 }) : "", anchos[n * 2], VERDE_BG),
      celda(par ? par[1] : "", anchos[n * 2 + 1]),
    ]);
    filas.push(`<w:tr>${celdas.join("")}</w:tr>`);
  }
  return tabla(filas, anchos);
}

function cuerpo(d: DatosFicha) {
  const hoy = new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Madrid" });
  const nPendientes = d.pendientes.length;
  const medidas = (apartados: DatosFicha["generales"]) =>
    apartados.length ? apartados.map((a) => subtitulo(a.titulo) + a.items.map(vineta).join("")).join("") : parrafo(run("Ninguna medida marcada.", { color: GRIS }));

  return [
    parrafo(run("FICHA DE ORIENTACIÓN DEL ALUMNO/A", { b: true, color: VERDE, sz: 32 }), { jc: "center", despues: 20 }),
    parrafo(run(`Atención a la diversidad · Curso ${d.curso}`, { color: GRIS }), { jc: "center", despues: 240 }),

    titulo("Datos del alumno/a"),
    tablaDatos([
      ["Alumno/a", run(d.alumno, { b: true })],
      ["Grupo", run(d.grupo)],
      ["Tutor/a", run(d.tutor)],
      ["Repetidor/a", d.repetidor ? run("Sí", { b: true, color: NARANJA }) : run("No")],
      ["Séneca", d.censado ? run("Censado/a", { b: true, color: AZUL }) : run("Sin censar", { b: true, color: NARANJA })],
      ["Tipo de NEAE", d.tipoNeae ? run(d.tipoNeae) : vacio()],
      ["Dictamen", run(d.dictamen ? "Sí" : "No")],
      ["Pendientes", nPendientes ? run(String(nPendientes)) : d.pendientesTexto ? run(d.pendientesTexto) : run("Ninguna")],
    ]),

    titulo("Diagnóstico"),
    textoLargo(d.diagnostico),

    nPendientes
      ? titulo("Materias pendientes") +
        tablaConCabecera(["Curso", "Materia", "Seguimiento (programa de refuerzo)"], d.pendientes.map((p) => [run(p.nivel), run(p.materia), p.profesor ? run(p.profesor) : run("Sin asignar", { color: GRIS })]), [1300, 3800, 3404])
      : "",

    titulo(`Medidas generales · ${d.curso}`, AZUL),
    medidas(d.generales),
    titulo(`Medidas específicas y programas · ${d.curso}`, NARANJA),
    medidas(d.especificas),

    titulo("Aspectos a tener en cuenta"),
    textoLargo(d.aspectos),

    titulo("Evaluación de las medidas"),
    tablaConCabecera(["1ª Evaluación", "2ª Evaluación", "Evaluación ordinaria"], [d.evaluaciones.map((e) => (e?.trim() ? run(e.trim()) : vacio()))], [2835, 2835, 2834]),

    d.historial.length ? titulo("Histórico") + d.historial.map((h) => subtitulo(h.etiqueta) + textoLargo(h.texto)).join("") : "",

    parrafo(run(`Documento generado el ${hoy} desde el Portal de Orientación. Contiene datos personales: uso confidencial y exclusivo del equipo docente.`, { i: true, color: GRIS, sz: 16 }), { antes: 360, jc: "center" }),
  ].join("");
}

export async function generarFichaWord(d: DatosFicha) {
  const zip = await JSZip.loadAsync(await readFile(path.join(process.cwd(), "src/plantillas/hoja-corporativa-vertical.docx")));
  const xml = await zip.file("word/document.xml")!.async("string");
  // Se conserva el <w:sectPr> final (cabecera, pie y márgenes de la hoja)
  zip.file("word/document.xml", xml.replace(/<w:body>[\s\S]*?(<w:sectPr)/, (_, sect) => `<w:body>${cuerpo(d)}${sect}`));
  return zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
}
