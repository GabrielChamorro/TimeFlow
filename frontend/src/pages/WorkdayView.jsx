import React, { useState, useEffect } from "react";
import { findTaskTemplate, getValidTaskTemplateId } from "../utils/taskTemplateSelection.js";
import TaskTimer from "../components/TaskTimer.jsx";
import TaskInlineEditor from "../components/TaskInlineEditor.jsx";
import EvidenceDropzone from "../components/EvidenceDropzone.jsx";
import EvidenceGallery from "../components/EvidenceGallery.jsx";
import DependencyPicker from "../components/DependencyPicker.jsx";

const getLocalDateISO = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatTaskDate = (value) => {
  if (!value) return "Fecha no registrada";
  const [year, month, day] = String(value).split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
};

const formatDeadline = (value, taskDate) => {
  if (!value) return "No asignada";

  const raw = String(value);
  if (/^\d{2}:\d{2}$/.test(raw)) {
    return `${formatTaskDate(taskDate)} ${raw}`;
  }

  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!match) return raw;

  const [, year, month, day, hour, minute] = match;
  return `${day}/${month}/${year} ${hour}:${minute}`;
};

export default function WorkdayView({
  currentUser,
  tareasPreestablecidas = [],
  userTasks = [],
  tasksReady = true,
  allTasks = [],
  onUploadEvidence,
  jornada,
  jornadaCargando,
  jornadaGuardando,
  jornadaError,
  onCheckIn,
  onCheckOut,
  onAddTask,
  onUpdateTask,
}) {
  const [taskType, setTaskType] = useState("pre");
  const [selectedPreId, setSelectedPreId] = useState("");
  const [customName, setCustomName] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [meta, setMeta] = useState("");
  const [deadline, setDeadline] = useState("");
  const [bitacoraInput, setBitacoraInput] = useState("");
  const [evidenceFiles, setEvidenceFiles] = useState([]);
  const [dependenciaIds, setDependenciaIds] = useState([]);
  const [taskError, setTaskError] = useState("");
  const [creatingTask, setCreatingTask] = useState(false);
  // El detalle se carga solo cuando el usuario lo abre, evitando solicitudes por cada tarea.
  const [evidenceTaskOpen, setEvidenceTaskOpen] = useState(null);
  const [checkoutConfirm, setCheckoutConfirm] = useState(false);
  const activeTaskCount = userTasks.filter(task => task.estado !== "Finalizada").length;
  const requestCheckOut = () => {
    if (!tasksReady) return;
    if (activeTaskCount) setCheckoutConfirm(true);
    else onCheckOut();
  };

  const formatJornadaDate = (value) => value
    ? new Date(value).toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" })
    : null;
  const durationLabel = (seconds) => {
    if (seconds == null) return null;
    const totalSeconds = Math.max(0, Math.floor(seconds));
    return `${Math.floor(totalSeconds / 3600)} h ${Math.floor(totalSeconds % 3600 / 60)} min ${totalSeconds % 60} s`;
  };

  // Solo se pueden crear tareas mientras exista una jornada activa.
  // Si el usuario aún no hizo Check In, o ya hizo Check Out, debe registrar ingreso primero.
  const hasActiveCheckIn = Boolean(jornada?.activa) && !jornadaCargando && !jornadaGuardando && !jornadaError;
  const controlesBloqueados = jornadaCargando || jornadaGuardando || Boolean(jornadaError);

  // El <select> entrega IDs como texto, aunque MySQL los envíe como números.
  // Mantener un único tipo de ID evita volver a la primera plantilla al cambiarla.
  useEffect(() => {
    if (taskType !== "pre") return;

    const validId = getValidTaskTemplateId(tareasPreestablecidas, selectedPreId);
    if (validId !== selectedPreId) setSelectedPreId(validId);

    const plantilla = findTaskTemplate(tareasPreestablecidas, validId);
    if (plantilla) setDescripcion(plantilla.descripcion || "");
    else setDescripcion("");
  }, [taskType, tareasPreestablecidas, selectedPreId]);

  const handlePlantillaChange = (e) => {
    const plantilla = findTaskTemplate(tareasPreestablecidas, e.target.value);
    if (!plantilla) return;
    setSelectedPreId(String(plantilla.id));
    setDescripcion(plantilla.descripcion || "");
  };


  const handleCreateTask = async (e) => {
    e.preventDefault();
    setTaskError("");

    // Doble validación en el frontend: aunque se intente enviar el formulario
    // manualmente, no se crea una tarea sin un Check In activo.
    if (!hasActiveCheckIn || creatingTask) return;

    const form = new FormData(e.currentTarget);
    const taskMeta = String(form.get("meta") || "").trim();
    const taskDeadline = String(form.get("deadline") || "");
    let taskName = String(form.get("customName") || "").trim();
    if (taskType === "pre") {
      const selectedObj = findTaskTemplate(tareasPreestablecidas, selectedPreId);
      if (!selectedObj) {
        setTaskError("Selecciona una plantilla válida antes de crear la tarea.");
        return;
      }
      taskName = selectedObj.nombre;
    }

    if (!taskName || !taskMeta || !taskDeadline) { setTaskError("Completa el nombre, la meta y la fecha y hora límite antes de guardar."); return; }

    const nuevaTarea = {
      // El backend genera un codigo unico al guardar la tarea.
      nombre: taskName,
      descripcion: descripcion || "Sin descripción",
      tipo: taskType === "pre" ? "Pre-establecida" : "Custom",
      asignadoA: currentUser?.nombre || "Gabriel Chamorro",
      fecha: getLocalDateISO(),
      fechaInicio: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }),
      fechaFin: null,
      fechaLimite: taskDeadline,
      meta: taskMeta,
      metaCumplida: false,
      estado: "En Progreso",
      bitacora: bitacoraInput || "Iniciando bloque de trabajo.",
      evidencia: null,
      dependenciaIds,
    };

    setCreatingTask(true);
    try {
      const guardada = await onAddTask(nuevaTarea);
      const fallidos=[];
      if (guardada?.id && onUploadEvidence) {
        for (const file of evidenceFiles) {
          try { await onUploadEvidence(guardada.id, file); }
          catch (error) { fallidos.push(`${file.name}: ${error.message}`); }
        }
      }
      if (fallidos.length) {
        setTaskError(`La tarea se creó, pero no se pudieron subir estos archivos: ${fallidos.join(", ")}. Puedes adjuntarlos desde el detalle de la tarea.`);
      }
    } catch (err) {
      setTaskError(err.message || "No se pudo guardar la tarea.");
      setCreatingTask(false);
      return;
    }
    setCreatingTask(false);

    // Resetear formulario
    setCustomName("");
    setMeta("");
    setDeadline("");
    setBitacoraInput("");
    setEvidenceFiles([]);
    setDependenciaIds([]);
  };

  return (
    <div className="space-y-6">
      {checkoutConfirm && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
        <div role="alertdialog" aria-modal="true" aria-labelledby="checkout-title" onKeyDown={e => { if (e.key === "Escape") setCheckoutConfirm(false); }} className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6">
          <h3 id="checkout-title" className="font-bold">Tienes tareas activas</h3>
          <p className="text-sm">Tienes {activeTaskCount} tarea(s) sin finalizar. ¿Registrar salida igualmente?</p>
          <div className="flex justify-end gap-3">
            <button type="button" autoFocus onClick={() => setCheckoutConfirm(false)} className="rounded-lg border px-3 py-2">Cancelar salida</button>
            <button type="button" disabled={jornadaGuardando} onClick={() => { setCheckoutConfirm(false); onCheckOut(); }} className="rounded-lg bg-rose-600 px-3 py-2 text-white">Confirmar Check-out</button>
          </div>
        </div>
      </div>}
      {/* Control de Asistencia */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-slate-900">
              Jornada de {currentUser?.nombre || "Usuario"}
            </h3>
            <span className="text-[11px] px-2.5 py-0.5 font-bold uppercase rounded-full bg-indigo-100 text-indigo-700">
              {currentUser?.rol || "trabajador"}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {jornadaCargando ? "Consultando jornada en MySQL..."
              : jornada?.checkInAt ? `Inicio: ${formatJornadaDate(jornada.checkInAt)}` : "No has registrado ingreso"}
            {jornada?.checkOutAt && ` | Salida: ${formatJornadaDate(jornada.checkOutAt)}`}
            {jornada?.duracionSegundos != null && ` | Total: ${durationLabel(jornada.duracionSegundos)}`}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            data-loading={jornadaGuardando}
            onClick={onCheckIn}
            disabled={controlesBloqueados || Boolean(jornada?.activa)}
            className={`px-5 py-2.5 rounded-xl font-semibold text-xs text-white transition-all ${
              controlesBloqueados || jornada?.activa
                ? "bg-slate-300 cursor-not-allowed"
                : "bg-emerald-600 hover:bg-emerald-700 shadow-xs cursor-pointer"
            }`}
          >
            Registrar ingreso
          </button>
          <button
            data-loading={jornadaGuardando}
            onClick={requestCheckOut}
            disabled={controlesBloqueados || !jornada?.activa || !tasksReady}
            className={`px-5 py-2.5 rounded-xl font-semibold text-xs text-white transition-all ${
              controlesBloqueados || !jornada?.activa
                ? "bg-slate-300 cursor-not-allowed"
                : "bg-rose-600 hover:bg-rose-700 shadow-xs cursor-pointer"
            }`}
          >
            Check Out (Salida)
          </button>
        </div>
      </div>

      {jornadaError && (
        <div role="alert" className="tf-ui-panel-enter rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
          {jornadaError} Recarga la página para volver a consultar el estado del servidor.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Formulario de Creación de Tareas */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 h-fit">
          <h3 className="text-base font-bold text-slate-900 border-b pb-2">+ Iniciar Nueva Tarea</h3>

          {!hasActiveCheckIn && !jornadaCargando && !jornadaError && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
              Debes registrar tu ingreso (Check In) antes de poder crear una tarea.
            </div>
          )}

          {taskError && <p role="alert" className="text-xs text-rose-700">{taskError}</p>}
          <form onSubmit={handleCreateTask} className="space-y-3">
            <fieldset disabled={!hasActiveCheckIn || creatingTask} className={!hasActiveCheckIn ? "space-y-3 opacity-60" : "space-y-3"}>
            <div className="flex gap-4 text-xs font-semibold">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="taskType"
                  value="pre"
                  checked={taskType === "pre"}
                  onChange={() => setTaskType("pre")}
                />
                Pre-Establecida
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="taskType"
                  value="custom"
                  checked={taskType === "custom"}
                  onChange={() => {
                    setTaskType("custom");
                    setDescripcion("");
                  }}
                />
                Personalizada
              </label>
            </div>

            {taskType === "pre" ? (
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Plantilla</label>
                <select
                  aria-label="Plantilla"
                  value={getValidTaskTemplateId(tareasPreestablecidas, selectedPreId)}
                  onChange={handlePlantillaChange}
                  disabled={tareasPreestablecidas.length === 0}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {tareasPreestablecidas.length === 0 && (
                    <option value="">No hay plantillas disponibles</option>
                  )}
                  {tareasPreestablecidas.map((t) => (
                    <option key={String(t.id)} value={String(t.id)}>
                      {t.nombre}
                    </option>
                  ))}
                </select>
                <label className="mt-2 block text-[11px] font-semibold text-slate-600">Título de plantilla
                  <input readOnly value={findTaskTemplate(tareasPreestablecidas, getValidTaskTemplateId(tareasPreestablecidas, selectedPreId))?.nombre || ""} className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs"/>
                </label>
              </div>
            ) : (
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Nombre Tarea</label>
                <input
                  type="text"
                  placeholder="Ej. Análisis de Logs de Servidor"
                  name="customName"
                  aria-label="Nombre Tarea"
                  value={customName}
                  maxLength={180}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Descripción</label>
              <textarea
                rows={2}
                value={descripcion}
                aria-label="Descripción"
                maxLength={3000}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Objetivo de la actividad..."
                className="w-full p-2.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Meta</label>
                <input
                  type="text"
                  placeholder="Ej. Revisar 50 registros"
                  name="meta"
                  required
                  aria-label="Meta"
                  value={meta}
                  maxLength={500}
                  onChange={(e) => setMeta(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Fecha y hora límite</label>
                <input
                  type="datetime-local"
                  name="deadline"
                  required
                  aria-label="Fecha y hora límite"
                  min={`${getLocalDateISO()}T00:00`}
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <DependencyPicker tasks={allTasks} value={dependenciaIds} onChange={setDependenciaIds} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Bitácora Inicial</label>
              <textarea
                rows={2}
                placeholder="Punto de partida o notas iniciales..."
                value={bitacoraInput}
                maxLength={10000}
                onChange={(e) => setBitacoraInput(e.target.value)}
                className="w-full p-2.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <EvidenceDropzone files={evidenceFiles} onChange={setEvidenceFiles} disabled={creatingTask}/>

            <button
              type="submit"
              data-loading={creatingTask}
              disabled={!hasActiveCheckIn || creatingTask || (taskType === "pre" && tareasPreestablecidas.length === 0)}
              className={`w-full py-2.5 text-white font-semibold rounded-xl text-xs transition-colors ${
                hasActiveCheckIn
                  ? "bg-indigo-600 hover:bg-indigo-700 cursor-pointer"
                  : "bg-slate-300 cursor-not-allowed"
              }`}
            >
              {creatingTask ? "Guardando..." : "+ Iniciar y Agregar a Mis Tareas"}
            </button>
            </fieldset>
          </form>
        </div>

        {/* Panel de Tareas Asignadas */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-slate-900">
              Mis Tareas Asignadas ({userTasks.length})
            </h3>
            <span className="text-xs text-slate-500">Cada tarea mantiene su bitácora independiente</span>
          </div>

          {userTasks.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
              No tienes tareas activas asignadas a tu perfil. Puedes iniciar una nueva desde el formulario.
            </div>
          ) : (
            <div className="space-y-4">
              {userTasks.map((task) => {
                const isUnderReview = task.estado === "En Revisión";
                const isApproved = task.estado === "Finalizada";

                return (
                  <div
                    key={task.id}
                    className={`p-5 rounded-2xl border bg-white shadow-xs transition-all space-y-3 ${
                      isApproved
                        ? "border-emerald-200 bg-emerald-50/20"
                        : isUnderReview
                        ? "border-amber-200 bg-amber-50/20"
                        : "border-indigo-100"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                            {task.codigo || `NODE-${task.id}`}
                          </span>
                          <span className="text-[11px] text-slate-400">Fecha: {formatTaskDate(task.fecha)} · Inicio: {task.fechaInicio || "Sin hora"}</span>
                          <span className="block text-[11px] text-slate-400 mt-0.5">Límite: {formatDeadline(task.fechaLimite, task.fecha)}</span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm mt-1">{task.nombre}</h4>
                        <TaskTimer task={task}/>
                        <p className="text-xs text-slate-500">{task.descripcion}</p>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                          isApproved
                            ? "bg-emerald-100 text-emerald-700"
                            : isUnderReview
                            ? "bg-amber-100 text-amber-700"
                            : "bg-indigo-100 text-indigo-700 animate-pulse"
                        }`}
                      >
                        {isApproved ? "Aprobada (Finalizada)" : isUnderReview ? "En revisión (Admin)" : "En progreso"}
                      </span>
                    </div>

                    <TaskInlineEditor key={task.id} task={task} onUpdateTask={onUpdateTask} />

                    {/* La misma galería de Monitoreo Espacial, sin duplicar reglas de archivos ni rutas. */}
                    <div className="space-y-2 border-t border-slate-100 pt-3">
                      <button
                        type="button"
                        aria-expanded={evidenceTaskOpen === String(task.id)}
                        aria-controls={`jornada-evidencias-${task.id}`}
                        onClick={() => setEvidenceTaskOpen(current => current === String(task.id) ? null : String(task.id))}
                        className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                      >
                        {evidenceTaskOpen === String(task.id)
                          ? "Ocultar evidencias"
                          : task.estado === "En Progreso"
                            ? "Adjuntar / ver archivos"
                            : "Ver archivos adjuntos"}
                      </button>
                      {evidenceTaskOpen === String(task.id) && (
                        <div id={`jornada-evidencias-${task.id}`}>
                          <EvidenceGallery
                            taskId={task.id}
                            taskVersion={task.version}
                            legacyEvidence={task.evidencia}
                            canEdit={task.estado === "En Progreso"}
                          />
                        </div>
                      )}
                    </div>

                    {isUnderReview && (
                      <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200 font-medium text-center">
                        Tarea enviada a revisión. El administrador debe aprobarla para cerrarla definitivamente.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
