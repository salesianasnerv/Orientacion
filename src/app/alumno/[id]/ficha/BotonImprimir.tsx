"use client";

export function BotonImprimir() {
  return <button type="button" className="btn pri" onClick={() => window.print()}>Guardar como PDF</button>;
}
