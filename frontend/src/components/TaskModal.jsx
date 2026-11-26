import ConfirmAction from "./ConfirmAction.jsx";
import React, { useEffect, useRef, useState } from "react";
import { ENDPOINTS, apiFetch } from "../config/api_interaccion_backend.js";
import EvidenceGallery from "./EvidenceGallery.jsx";
import TaskRecords from "./TaskRecords.jsx";
import { getDependencyIds, wouldCreateCycle } from "../utils/mapLayout.js";
import DependencyPicker from "./DependencyPicker.jsx";

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
  task: initialTask,
  currentUser,
  onClose,
  onUpdateTask,
  onApproveTask,
  onRejectTask,
  onDeleteTask,
  allTasks = [],
}) {
  const [task, setTask] = useState(initialTask);
  const [conflict, setConflict] = useState(false);
  const [recentTask, setRecentTask] = useState(null);
  const reviewRecent = async () => {
    try {
      const response = await apiFetch(ENDPOINTS.TAREAS);
      const data = await response.json();
      if (!response.ok || !Array.isArray(data)) throw new Error();
      const recent = data.find(item => String(item.id) === String(task.id));
      if (!recent) throw new Error();
      setRecentTask(recent);
    } catch { setError("No se pudo actualizar la tarea. Tu borrador se conserva."); }
  };
  const isOwner = task.asignadoUsuarioId != null
    ? Number(currentUser.id) === Number(task.asignadoUsuarioId)
    : currentUser.nombre === task.asignadoA;
  const isAdmin = currentUser.rol === "admin";
  const liveTask = allTasks.find(item => String(item.id) === String(task.id));
  // Bloquear también si otra sesión acaba de aprobar. Conservar la versión base/borrador para los 409.
  const visibleState = liveTask?.estado || task.estado;
  const isLocked = visibleState === "Finalizada";
  const isUnderReview = visibleState === "En Revisión";
  const canEdit = (isOwner || isAdmin) && visibleState === "En Progreso";
  const canDelete = !isLocked && (isOwner || isAdmin);

  const [dependenciaIds, setDependenciaIds] = useState(() => getDependencyIds(task).map(Number));
  const [error,setError] = useState("");
  const [motivoRechazo, setMotivoRechazo] = useState("");
  const [metaCumplida, setMetaCumplida] = useState(task.metaCumplida || false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [saveState, setSaveState] = useState("idle");
  const closeTimer = useRef(null);
  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!canEdit || conflict || saveState === "saving") return;

    if (wouldCreateCycle(task.id, dependenciaIds, allTasks)) {
      setError("La dependencia elegida formaría un ciclo entre tareas.");return;
    }
    setError("");
    setSaveState("saving");
    const tareaGuardada = await onUpdateTask({ ...task, metaCumplida, dependenciaIds });

    if (tareaGuardada?.conflict) {
      setConflict(true); setRecentTask(null); setSaveState("idle");
      setError(tareaGuardada.message); return;
    }
    if (!tareaGuardada) {
      setSaveState("idle");
      setError("No se pudieron guardar los cambios de la tarea.");
      return;
    }

    // muestra la confirmacion un momento antes de cerrar el detalle
    setSaveState("saved");
    closeTimer.current = window.setTimeout(() => onClose(), 650);
  };

  const handleConfirmDelete = async () => {
    if (!onDeleteTask || saveState === "saving") return;
    setError("");
    setSaveState("saving");
    try {
      const eliminado = await onDeleteTask(task.id, task.version);
      if (eliminado?.conflict) {
        setConflict(true); setRecentTask(null); setError(eliminado.message);
      } else if (eliminado === true) {
        onClose();
        return;
      }
      if (!eliminado?.conflict) setError("No se pudo desactivar la tarea. Comprueba la conexión e inténtalo nuevamente.");
    } catch {
      setError("No se pudo desactivar la tarea.");
    } finally {
      setShowDeleteConfirm(false);
      setSaveState("idle");
    }
  };

  const handleDecision = async (accion, reason) => {
    if (saveState === "saving") return;
    setError("");
    setSaveState("saving");
    try {
      const actualizada = await accion(task.id, reason, task.version, task);
      if (actualizada?.conflict) {
        setConflict(true); setRecentTask(null); setError(actualizada.message);
      } else if (actualizada) {
        onClose();
      } else {
        setError("No se pudieron guardar los cambios del estado. La tarea no se ha cerrado.");
      }
    } catch {
      setError("No se pudo actualizar el estado de la tarea.");
    } finally {
      setSaveState("idle");
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div role="dialog" aria-modal="true" aria-label="Detalle de la tarea" className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
        <div className="flex justify-between items-start border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md font-semibold">
                {task.id}
              </span>
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                  visibleState === "Finalizada"
                    ? "bg-emerald-100 text-emerald-700"
                    : visibleState === "En Revisión"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-indigo-100 text-indigo-700"
                }`}
              >
                {visibleState}
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
              <p className="font-semibold text-slate-800">{(isLocked ? liveTask?.fechaFin : null) || task.fechaFin || (isLocked ? "Sin hora registrada" : "En proceso")}</p>
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

          <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-3">
            <DependencyPicker tasks={allTasks} taskId={task.id} refreshTag={allTasks.find(t => String(t.id) === String(task.id))?.ultimoRegistroId} value={dependenciaIds} onChange={setDependenciaIds} disabled={!canEdit} />
          </div>
          {conflict && <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 space-y-2 text-xs">
            <p>Tu borrador se conserva. Revisa los datos guardados por la otra sesión antes de volver a guardar.</p>
            <button type="button" onClick={reviewRecent} className="underline">Revisar versión reciente</button>
            {recentTask && <>
              <p>Estado reciente: {recentTask.estado}. Meta cumplida: {recentTask.metaCumplida ? "Sí" : "No"}.</p>
              <pre className="whitespace-pre-wrap break-words">Bitácora reciente: {recentTask.bitacora || "(vacía)"}</pre>
              <p>Dependencias recientes: {getDependencyIds(recentTask).join(", ") || "Ninguna"}</p>
              <button type="button" className="underline" onClick={() => { setTask(recentTask); setRecentTask(null); setConflict(false); setError("Datos actualizados. Revisa tu borrador antes de guardar."); }}>Usar esta versión como base y conservar mi borrador</button>
            </>}
          </div>}
          {error && <p role="alert" className="text-xs text-rose-700">{error}</p>}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Bitácora anterior (sin fechas individuales)</label>
            <textarea
              rows={3}
              disabled={!canEdit}
              value={task.bitacora || ""}
              maxLength={10000}
              readOnly
              className={`w-full p-2.5 text-xs border rounded-lg ${
                !canEdit ? "bg-slate-100 text-slate-500" : "bg-white border-slate-300 focus:ring-2 focus:ring-indigo-500"
              }`}
            />
          </div>

          {(isOwner || isAdmin) && <TaskRecords taskId={task.id} canAdd={canEdit} refreshTag={allTasks.find(t => String(t.id) === String(task.id))?.ultimoRegistroId}/>}
          {(isOwner || isAdmin) && <TaskRecords taskId={task.id} refreshTag={allTasks.find(t => String(t.id) === String(task.id))?.ultimoRegistroId} kind="RECHAZO"/>}
          {isAdmin && isUnderReview && <label className="block text-xs font-semibold">Motivo de rechazo (obligatorio para devolver)
            <textarea rows={3} maxLength={3000} value={motivoRechazo} disabled={saveState === "saving"} onChange={e => setMotivoRechazo(e.target.value)} className="mt-1 w-full rounded-lg border p-2"/>
          </label>}
          {(isOwner || isAdmin) && <EvidenceGallery taskId={task.id} taskVersion={task.version} legacyEvidence={task.evidencia} canEdit={canEdit}/>}

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
                  Desactivar Tarea
                </button>
              )}
            </div>

            <div className="flex gap-2">
              {isAdmin && isUnderReview && (
                <>
                  <button
                    type="button"
                    onClick={() => handleDecision(onRejectTask, motivoRechazo)}
                    disabled={saveState === "saving" || conflict || !motivoRechazo.trim()}
                    className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold rounded-lg text-xs transition-colors"
                  >
                    Devolver a Progreso
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDecision(onApproveTask)}
                    disabled={saveState === "saving"}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs transition-colors shadow-xs"
                  >
                    Aprobar y finalizar tarea
                  </button>
                </>
              )}

              {canEdit && (
                <button
                  type="submit"
                  data-loading={saveState === "saving"}
                  disabled={conflict || saveState !== "idle"}
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

        {showDeleteConfirm && <ConfirmAction title="Confirmar desactivación de la tarea" confirmLabel="Sí, desactivar tarea" pending={saveState === "saving"} error={error} onCancel={()=>setShowDeleteConfirm(false)} onConfirm={handleConfirmDelete}>
          <p>Vas a desactivar la tarea <strong>"{task.nombre}"</strong>. Ya no aparecerá en el mapa, pero su bitácora y evidencias seguirán guardadas en MySQL.</p>
        </ConfirmAction>}

      </div>
    </div>
  );
}
