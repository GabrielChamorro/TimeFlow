import React, { useState } from "react";

const formatTaskDate = (value) => {
  if (!value) return "Fecha no registrada";
  const [year, month, day] = String(value).split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
};

const formatDeadline = (value, taskDate) => {
  if (!value) return "No asignada";
  const raw = String(value);
  if (/^\d{2}:\d{2}$/.test(raw)) return `${formatTaskDate(taskDate)} ${raw}`;
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!match) return raw;
  const [, year, month, day, hour, minute] = match;
  return `${day}/${month}/${year} ${hour}:${minute}`;
};

export default function TaskModal({
  task,
  currentUser,
  onClose,
  onUpdateTask,
  onApproveTask,
  onRejectTask,
  onDeleteTask,
}) {
  const isOwner = currentUser.nombre === task.asignadoA;
  const isAdmin = currentUser.rol === "admin";
  const isLocked = task.estado === "Finalizada";
  const isUnderReview = task.estado === "En Revisión";
  const canEdit = isOwner && task.estado === "En Progreso";
  const canDelete = !isLocked && (isOwner || isAdmin);

  const [bitacora, setBitacora] = useState(task.bitacora || "");
  const [metaCumplida, setMetaCumplida] = useState(task.metaCumplida || false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [saveState, setSaveState] = useState("idle");

  const handleSave = async (e) => {
    e.preventDefault();
    if (!canEdit || saveState === "saving") return;

    setSaveState("saving");
    const tareaGuardada = await onUpdateTask({ ...task, bitacora, metaCumplida });

    if (!tareaGuardada) {
      setSaveState("idle");
      return;
    }

    // muestra la confirmacion un momento antes de cerrar el detalle
    setSaveState("saved");
    setTimeout(() => onClose(), 650);
  };

  const handleConfirmDelete = () => {
    if (onDeleteTask) {
      onDeleteTask(task.id);
      setShowDeleteConfirm(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex justify-between items-start border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md font-semibold">
                {task.id}
              </span>
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                  task.estado === "Finalizada"
                    ? "bg-emerald-100 text-emerald-700"
                    : task.estado === "En Revisión"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-indigo-100 text-indigo-700"
                }`}
              >
                {task.estado}
              </span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mt-1">{task.nombre}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1">
            ×
          </button>
        </div>

        {isLocked && (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-medium">
            Tarea aprobada y finalizada: los registros están bloqueados para mantener el historial.
          </div>
        )}

        {isUnderReview && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs font-medium">
            Tarea lista para revisión: está esperando la aprobación del administrador.
          </div>
        )}

        {!isOwner && !isAdmin && !isLocked && (
          <div className="mt-3 p-3 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 text-xs font-medium">
            Modo solo lectura: solo <strong>{task.asignadoA}</strong> puede modificar esta bitácora.
          </div>
        )}

        <form onSubmit={handleSave} className="mt-4 space-y-4 text-sm">
          {task.descripcion && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <p className="text-[11px] font-bold text-slate-500 uppercase">Descripción</p>
              <p className="text-xs text-slate-700 mt-0.5">{task.descripcion}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 text-slate-600 text-xs">
            <div>
              <p className="text-slate-400">Responsable</p>
              <p className="font-semibold text-slate-800">{task.asignadoA}</p>
            </div>
            <div>
              <p className="text-slate-400">Fecha de la tarea</p>
              <p className="font-semibold text-slate-800">{formatTaskDate(task.fecha)}</p>
            </div>
            <div>
              <p className="text-slate-400">Hora de inicio</p>
              <p className="font-semibold text-slate-800">{task.fechaInicio || "Sin hora"}</p>
            </div>
            <div>
              <p className="text-slate-400">Fecha y hora límite</p>
              <p className="font-semibold text-slate-800">{formatDeadline(task.fechaLimite, task.fecha)}</p>
            </div>
            <div>
              <p className="text-slate-400">Término / Cierre</p>
              <p className="font-semibold text-slate-800">{task.fechaFin || "En proceso"}</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Meta Asignada</label>
            <p className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium text-xs">
              {task.meta}
            </p>
            {canEdit && (
              <label className="flex items-center gap-2 mt-2 cursor-pointer text-slate-700 text-xs">
                <input
                  type="checkbox"
                  checked={metaCumplida}
                  onChange={(e) => setMetaCumplida(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600"
                />
                Marcar meta como cumplida
              </label>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Bitácora de Trabajo</label>
            <textarea
              rows={3}
              disabled={!canEdit}
              value={bitacora}
              maxLength={10000}
              onChange={(e) => setBitacora(e.target.value)}
              className={`w-full p-2.5 text-xs border rounded-lg ${
                !canEdit ? "bg-slate-100 text-slate-500" : "bg-white border-slate-300 focus:ring-2 focus:ring-indigo-500"
              }`}
            />
          </div>

          {task.evidencia && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Evidencia Adjunta</label>
              <img src={task.evidencia} alt="Evidencia" className="w-full h-32 object-cover rounded-lg border border-slate-200" />
            </div>
          )}

          <div className="flex flex-wrap justify-between items-center gap-2 pt-2 border-t border-slate-100">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg text-xs"
              >
                Cerrar
              </button>
              {canDelete && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-medium rounded-lg text-xs transition-colors"
                >
                  Eliminar Tarea
                </button>
              )}
            </div>

            <div className="flex gap-2">
              {isAdmin && isUnderReview && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      onRejectTask(task.id);
                      onClose();
                    }}
                    className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold rounded-lg text-xs transition-colors"
                  >
                    Devolver a Progreso
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onApproveTask(task.id);
                      onClose();
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs transition-colors shadow-xs"
                  >
                    Aprobar y finalizar tarea
                  </button>
                </>
              )}

              {canEdit && (
                <button
                  type="submit"
                  disabled={saveState !== "idle"}
                  className={`px-4 py-2 text-white font-medium rounded-lg text-xs transition-colors min-w-[118px] ${
                    saveState === "saved"
                      ? "bg-emerald-600"
                      : saveState === "saving"
                      ? "bg-indigo-400 cursor-wait"
                      : "bg-indigo-600 hover:bg-indigo-700"
                  }`}
                >
                  {saveState === "saved"
                    ? "Guardado"
                    : saveState === "saving"
                    ? "Guardando..."
                    : "Guardar Cambios"}
                </button>
              )}
            </div>
          </div>
        </form>

        {/* Modal "¿Estás seguro?" de eliminación de tarea */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-60">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-xl font-bold mx-auto">
                !
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">¿Estás seguro?</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Vas a eliminar la tarea <strong className="text-slate-800">"{task.nombre}"</strong>. Esta acción eliminará su nodo y bitácora de forma permanente.
                </p>
              </div>
              <div className="flex gap-2 justify-center pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl text-xs shadow-xs"
                >
                  Sí, eliminar tarea
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}