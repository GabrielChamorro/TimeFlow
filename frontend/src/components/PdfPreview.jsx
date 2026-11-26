import React, { useEffect, useRef, useState } from "react";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist/build/pdf.mjs";
import workerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";
import { boundedPdfScale } from "../utils/pdfViewport.js";

GlobalWorkerOptions.workerSrc = workerUrl;

// API de dibujo únicamente: no se incorpora el viewer, scripting, anotaciones HTML ni enlaces del PDF.
export default function PdfPreview({ source, name }) {
  const canvas = useRef(null);
  const [document, setDocument] = useState(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const [rendered, setRendered] = useState(false);
  useEffect(() => {
    let cancelled = false, task;
    (async () => {
      const response = await fetch(source, { credentials: "omit" });
      if (!response.ok) throw new Error();
      task = getDocument({ data: new Uint8Array(await response.arrayBuffer()),
        isEvalSupported: false, enableXfa: false, useWasm: false,
        maxImageSize: 16_000_000, canvasMaxAreaInBytes: 32_000_000,
        useSystemFonts: true, disableAutoFetch: true, disableStream: true });
      const pdf = await task.promise;
      if (!cancelled) setDocument(pdf);
    })().catch(() => { if (!cancelled) setError("No se pudo mostrar este PDF. Puedes descargarlo para revisarlo en una aplicación compatible."); });
    return () => { cancelled = true; task?.destroy(); };
  }, [source]);
  useEffect(() => {
    if (!document) return;
    let cancelled = false, renderTask;
    (async () => {
      setRendered(false);
      const pdfPage = await document.getPage(page);
      if (cancelled) return;
      const natural = pdfPage.getViewport({ scale: 1 });
      const viewport = pdfPage.getViewport({ scale: boundedPdfScale(natural.width, natural.height) });
      const surface = canvas.current;
      if (!surface) return;
      surface.width = Math.ceil(viewport.width); surface.height = Math.ceil(viewport.height);
      renderTask = pdfPage.render({ canvas: surface, viewport });
      await renderTask.promise;
      if (!cancelled) setRendered(true);
    })().catch(err => { if (!cancelled && err?.name !== "RenderingCancelledException") setError("No se pudo dibujar esta página del PDF."); });
    return () => { cancelled = true; renderTask?.cancel(); };
  }, [document, page]);
  return <div className="space-y-2" aria-label="Visor protegido de PDF">
    {error ? <p role="alert" className="text-xs text-rose-700">{error}</p> : <>
      {!rendered && <p role="status" className="text-xs text-slate-500">Dibujando PDF…</p>}
      <div className="max-h-[32rem] overflow-auto rounded-lg bg-slate-100 border border-slate-200">
        <canvas ref={canvas} role="img" aria-label={`Página ${page} de ${name}`} className="mx-auto max-w-full h-auto" />
      </div>
      {document && <div className="flex items-center justify-center gap-3 text-xs">
        <button type="button" disabled={page<=1 || !rendered} onClick={()=>setPage(p=>p-1)}>Página anterior</button>
        <span>Página {page} de {document.numPages}</span>
        <button type="button" disabled={page>=document.numPages || !rendered} onClick={()=>setPage(p=>p+1)}>Página siguiente</button>
      </div>}
    </>}
  </div>;
}
