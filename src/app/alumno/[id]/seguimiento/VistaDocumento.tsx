"use client";

import { useEffect, useRef, useState } from "react";

// Muestra el Word generado tal cual (docx-preview) y lo imprime / guarda como PDF desde el navegador
export function VistaDocumento({ urlVista, urlWord }: { urlVista: string; urlWord: string }) {
  const caja = useRef<HTMLDivElement>(null);
  const [estado, setEstado] = useState<"cargando" | "listo" | "error">("cargando");

  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const [{ renderAsync }, res] = await Promise.all([import("docx-preview"), fetch(urlVista)]);
        if (!res.ok) throw new Error(await res.text());
        const datos = await res.blob();
        if (cancelado || !caja.current) return;
        caja.current.innerHTML = "";
        await renderAsync(datos, caja.current, undefined, { inWrapper: true, ignoreLastRenderedPageBreak: true, experimental: true });
        // Página apaisada o vertical según la plantilla, para que el PDF salga igual
        const hoja = caja.current.querySelector<HTMLElement>("section.docx");
        const apaisada = !!hoja && hoja.offsetWidth > hoja.offsetHeight;
        let estilo = document.getElementById("pagina-pdf");
        if (!estilo) { estilo = document.createElement("style"); estilo.id = "pagina-pdf"; document.head.appendChild(estilo); }
        estilo.textContent = `@page { size: A4 ${apaisada ? "landscape" : "portrait"}; margin: 0; }`;
        setEstado("listo");
      } catch {
        if (!cancelado) setEstado("error");
      }
    })();
    return () => { cancelado = true; };
  }, [urlVista]);

  return (
    <>
      <div className="barra no-imprimir">
        <a className="btn pri" href={urlWord} download>Descargar Word</a>
        <button type="button" className="btn pri" disabled={estado !== "listo"} onClick={() => window.print()}>Descargar PDF</button>
        <span className="muted small">Para el PDF, elige «Guardar como PDF» en la ventana de impresión.</span>
      </div>
      {estado === "cargando" && <p className="muted no-imprimir">Generando documento…</p>}
      {estado === "error" && <p className="aviso no-imprimir">No se ha podido generar la vista previa. Puedes descargar el Word.</p>}
      <div ref={caja} className="vista-docx" />
    </>
  );
}
