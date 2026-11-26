import { useEffect, useRef, useState } from "react";
import { canSubmitDeactivation, matchesDeactivationTarget } from "../utils/deactivationConfirm.js";

/**
 * Confirmación deliberada para las bajas lógicas de administración.
 * Cuenta: aviso, escribir correo, última revisión. Plantilla: aviso, escribir nombre.
 * No se borra información, solo se utiliza la acción existente de desactivación.
 */
export default function ConfirmDeactivation({ kind, record, pending = false, error = "", onCancel, onConfirm }) {
  const [step, setStep] = useState(1);
  const [typed, setTyped] = useState("");
  const requestInFlight = useRef(false);
  const dialogRef = useRef(null);
  const isAccount = kind === "account";
  const steps = isAccount ? 3 : 2;
  const target = isAccount ? String(record.email || "") : String(record.nombre || "");
  const matches = matchesDeactivationTarget(typed, target);
  const lastStep = step === steps;
  const targetLabel = isAccount ? "correo electrónico" : "nombre de la plantilla";
  const title = isAccount ? "Desactivar cuenta" : "Desactivar tipo de tarea";

  useEffect(() => {
    const node = dialogRef.current;
    const previousFocus = document.activeElement;
    const focused = node?.querySelector('[autofocus], input, button:not(:disabled)');
    focused?.focus();
    return () => previousFocus?.focus?.();
  }, []);

  const cancel = () => { if (!pending && !requestInFlight.current) onCancel?.(); };
  const handleKeyDown = (event) => {
    if (event.key === "Escape" && !pending && !requestInFlight.current) {
      event.preventDefault();
      event.stopPropagation();
      onCancel?.();
    }
    // El foco no puede salir del diálogo usando Tab.
    if (event.key === "Tab") {
      const elements = Array.from(dialogRef.current?.querySelectorAll('button:not(:disabled),input:not(:disabled)') || []);
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  };

  const confirm = async () => {
    if (pending || requestInFlight.current || !canSubmitDeactivation({ kind, step, typed, target })) return;
    requestInFlight.current = true;
    try {
      await onConfirm?.();
    } finally {
      requestInFlight.current = false;
    }
  };

  const next = () => {
    if (pending || requestInFlight.current || step >= steps) return;
    if (step === 2 && isAccount && !matches) return;
    setStep((previous) => Math.min(steps, previous + 1));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm" role="presentation">
      <div ref={dialogRef} onKeyDown={handleKeyDown} role="alertdialog" aria-modal="true" aria-labelledby="tf-deactivate-title" aria-describedby="tf-deactivate-desc" className="w-full max-w-lg rounded-2xl border border-rose-100 bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700">Confirmación {step} de {steps}</span>
          <span className="text-xs font-semibold text-slate-500">Los datos se conservarán</span><button type="button" aria-label="Cerrar confirmación" disabled={pending} onClick={cancel} className="rounded-lg px-2 py-1 text-slate-600">×</button>
        </div>
        <div className="mt-4 flex gap-2" aria-hidden="true">
          {Array.from({ length: steps }, (_, index) => <span key={index} className={`h-1.5 flex-1 rounded-full transition-colors ${index < step ? "bg-rose-500" : "bg-slate-200"}`} />)}
        </div>
        <h2 id="tf-deactivate-title" className="mt-5 text-xl font-extrabold text-slate-900">{title}</h2>
        <div id="tf-deactivate-desc" className="mt-3 space-y-2 text-sm leading-relaxed text-slate-600" aria-live="polite">
          {step === 1 && (isAccount ? <>
            <p>Vas a desactivar la cuenta de <strong className="text-slate-900">{record.nombre}</strong> (<span className="break-all font-semibold">{target}</span>).</p>
            <p>La persona perderá acceso a TimeFlow hasta que un administrador reactive su cuenta. Su información no se eliminará.</p>
          </> : <>
            <p>Vas a retirar del catálogo activo la plantilla <strong className="text-slate-900">{record.nombre}</strong>.</p>
            <p>Ya no estará disponible para crear tareas nuevas. Las tareas anteriores y los datos de la plantilla se conservarán.</p>
          </>)}
          {step === 2 && <>
            <p><strong className="text-slate-900">Segunda advertencia:</strong> verifica que escogiste el registro correcto.</p>
            <label htmlFor="tf-deactivate-typed" className="block font-semibold text-slate-800">Escribe el {targetLabel} para continuar:</label>
            <div className="rounded-lg bg-slate-100 px-3 py-2 font-mono text-xs text-slate-800 break-all select-text">{target}</div>
            <input id="tf-deactivate-typed" autoFocus type="text" autoComplete="off" spellCheck="false" value={typed} onChange={(event) => setTyped(event.target.value)} disabled={pending} placeholder={isAccount ? "Correo electrónico exacto" : "Nombre exacto de la plantilla"} aria-invalid={typed.length > 0 && !matches} className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100" />
            {typed && !matches && <p className="text-xs text-rose-700">El texto todavía no coincide con el registro seleccionado.</p>}
          </>}
          {step === 3 && <>
            <p><strong className="text-rose-800">Última advertencia:</strong> vas a bloquear el acceso de esta cuenta.</p>
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3">
              <p className="font-bold text-slate-900">{record.nombre}</p>
              <p className="break-all text-xs text-slate-700">{target}</p>
            </div>
            <p>Comprueba nuevamente que la cuenta es la correcta. Esta acción se puede revertir desde Gestión de usuarios.</p>
          </>}
        </div>
        {error && <p role="alert" className="mt-4 rounded-lg bg-rose-50 p-3 text-xs text-rose-800">{error}</p>}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <button type="button" disabled={pending} onClick={cancel} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Cancelar</button>
          <div className="flex gap-2">
            {step > 1 && <button type="button" disabled={pending} onClick={() => setStep((value) => Math.max(1, value - 1))} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50">Atrás</button>}
            {lastStep ? (
              <button type="button" autoFocus={step === 3} disabled={pending || !canSubmitDeactivation({ kind, step, typed, target })} data-loading={pending} onClick={confirm} className="rounded-xl bg-rose-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-rose-800 disabled:cursor-not-allowed disabled:opacity-40">{pending ? "Desactivando…" : isAccount ? "Confirmar desactivación de cuenta" : "Confirmar desactivación"}</button>
            ) : (
              <button type="button" autoFocus={step === 1} disabled={pending || (step === 2 && !matches)} onClick={next} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40">{step === 1 ? "Revisar advertencia siguiente" : "Revisar confirmación final"}</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
