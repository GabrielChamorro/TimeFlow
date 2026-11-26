import React, { useEffect, useRef } from "react";

// Detalle exclusivo de datos sintéticos del Sprint 5.
// No comparte las acciones de edición/borrado/aprobación de TaskModal.
export default function DemoTaskModal({ task, onClose }) {
  const closeButtonRef = useRef(null);
  const dialogRef = useRef(null);

  useEffect(() => {
    const previousFocus = document.activeElement;
    closeButtonRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
      }
      if (event.key === "Tab") {
        // Impedir que el foco salga hacia botones de la aplicación real.
        const buttons = [...(dialogRef.current?.querySelectorAll("button:not([disabled])") || [])];
        if (buttons.length === 0) return;
        const first = buttons[0];
        const last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown, true);
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      previousFocus?.focus?.();
    };
  }, [onClose]);

  if (!task) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="demo-task-title"
        aria-describedby="demo-task-warning"
        className="w-full max-w-lg rounded-2xl border border-indigo-200 bg-white p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-700">
              Sprint 5 · Tarea ficticia
            </p>
            <h2 id="demo-task-title" className="mt-1 text-xl font-bold text-slate-900">
              {task.nombre}
            </h2>
            <p className="mt-1 text-xs text-slate-500">{task.codigo}</p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Cerrar detalle de prueba"
            className="rounded-lg px-2 py-1 text-lg font-semibold text-slate-500 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-indigo-600"
          >
            ×
          </button>
        </div>

        <p
          id="demo-task-warning"
          className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-medium text-amber-900"
        >
          Solo lectura. Esta tarea es de demostración y no existe en MySQL. No se puede modificar,
          aprobar ni eliminar.
        </p>

        <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
          <div>
            <dt className="text-slate-500">Estado</dt>
            <dd className="mt-1 font-semibold text-slate-900">{task.estado}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Responsable ficticio</dt>
            <dd className="mt-1 font-semibold text-slate-900">{task.asignadoA}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Fecha de creación</dt>
            <dd className="mt-1 font-semibold text-slate-900">{task.fecha}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Fecha límite</dt>
            <dd className="mt-1 font-semibold text-slate-900">{task.fechaLimite?.replace("T", " ")}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Meta</dt>
            <dd className="mt-1 font-semibold text-slate-900">
              {task.metaCumplida ? "Cumplida" : "Pendiente"}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Identificador de prueba</dt>
            <dd className="mt-1 font-semibold text-slate-900">{task.id}</dd>
          </div>
        </dl>

        <div className="mt-4 space-y-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[11px] font-bold uppercase text-slate-500">Descripción</p>
            <p className="mt-1 text-sm text-slate-700">{task.descripcion}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[11px] font-bold uppercase text-slate-500">Meta asignada</p>
            <p className="mt-1 text-sm text-slate-700">{task.meta}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[11px] font-bold uppercase text-slate-500">Bitácora de prueba</p>
            <p className="mt-1 text-sm text-slate-700">{task.bitacora}</p>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Cerrar
          </button>
        </div>
      </section>
    </div>
  );
}
