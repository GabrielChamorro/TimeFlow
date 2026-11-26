import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";

/** Confirmación explícita: cancelar, X o Escape nunca ejecutan la acción. */
export default function ConfirmAction({ title, children, confirmLabel, pending = false, error = "", onCancel, onConfirm }) {
  const ref = useRef(null), inFlight = useRef(false), titleId = useId(), descriptionId = useId();
  useEffect(() => {
    const trigger = document.activeElement;
    ref.current?.querySelector('button')?.focus();
    return () => { if (trigger?.isConnected) trigger.focus?.(); };
  }, []);
  const cancel = () => { if (!pending && !inFlight.current) onCancel(); };
  const confirm = async () => {
    if (pending || inFlight.current) return;
    inFlight.current = true;
    try { await onConfirm(); } finally { inFlight.current = false; }
  };
  const keyboard = event => {
    if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); cancel(); }
    if (event.key !== "Tab") return;
    const buttons = [...ref.current.querySelectorAll('button:not(:disabled)')];
    const first = buttons[0], last = buttons.at(-1);
    if (!first) { event.preventDefault(); return; }
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  };
  return createPortal(<div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
    <div ref={ref} role="alertdialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId} aria-busy={pending} onKeyDown={keyboard} className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
      <div className="flex items-center justify-between gap-3"><h2 id={titleId} className="text-base font-bold text-slate-900">{title}</h2><button type="button" disabled={pending} onClick={cancel} aria-label="Cerrar confirmación" className="rounded-lg px-2 py-1 text-slate-600">×</button></div>
      <div id={descriptionId} className="text-sm text-slate-600">{children}</div>
      {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
      <div className="flex justify-end gap-2"><button type="button" disabled={pending} onClick={cancel} className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">Cancelar</button>
        <button type="button" disabled={pending} onClick={confirm} className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white">{pending ? "Desactivando…" : confirmLabel}</button></div>
    </div>
  </div>, document.body);
}
