import React, { useState, useEffect } from "react";

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
  jornada,
  jornadaCargando,
  jornadaGuardando,
  jornadaError,
  onCheckIn,
  onCheckOut,
  onAddTask,
  onUpdateTask,
  onSendToReview,
}) {
  const [taskType, setTaskType] = useState("pre");
  const [selectedPreId, setSelectedPreId] = useState("");
  const [customName, setCustomName] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [meta, setMeta] = useState("");
  const [deadline, setDeadline] = useState("");
  const [bitacoraInput, setBitacoraInput] = useState("");
  const [previewImage, setPreviewImage] = useState(null);
  const [evidenceError, setEvidenceError] = useState("");
  const [taskError, setTaskError] = useState("");
  const [creatingTask, setCreatingTask] = useState(false);

  const formatJornadaDate = (value) => value
    ? new Date(value).toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" })
    : null;
  const durationLabel = (seconds) => {
    if (seconds == null) return null;
    const totalMinutes = Math.floor(seconds / 60);
    return `${Math.floor(totalMinutes / 60)} h ${totalMinutes % 60} min`;
  };

  // Solo se pueden crear tareas mientras exista una jornada activa.
  // Si el usuario aún no hizo Check In, o ya hizo Check Out, debe registrar ingreso primero.
  const hasActiveCheckIn = Boolean(jornada?.activa) && !jornadaCargando && !jornadaGuardando && !jornadaError;
  const controlesBloqueados = jornadaCargando || jornadaGuardando || Boolean(jornadaError);

  // Inicializar o sincronizar la plantilla seleccionada y su descripción
  useEffect(() => {
    if (taskType === "pre" && tareasPreestablecidas.length > 0) {
      const plantillaValida = tareasPreestablecidas.find((t) => t.id === selectedPreId)
        ? selectedPreId
        : tareasPreestablecidas[0].id;

      setSelectedPreId(plantillaValida);
      const plantilla = tareasPreestablecidas.find((t) => t.id === plantillaValida);
      if (plantilla) {
        setDescripcion(plantilla.descripcion || "");
      }
    }
  }, [taskType, tareasPreestablecidas, selectedPreId]);

  const handlePlantillaChange = (e) => {
    const id = e.target.value;
    setSelectedPreId(id);
    const found = tareasPreestablecidas.find((t) => String(t.id) === String(id));
    if (found) {
      setDescripcion(found.descripcion || "");
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    setEvidenceError("");
    setPreviewImage(null);

    if (!file) return;

    const allowedTypes = ["image/png", "image/jpeg", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setEvidenceError("Solo se permiten imágenes PNG, JPG/JPEG, GIF o WEBP.");
      e.target.value = "";
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setEvidenceError("La imagen no puede superar 2 MB.");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") setPreviewImage(reader.result);
    };
    reader.onerror = () => setEvidenceError("No se pudo leer la imagen seleccionada.");
    reader.readAsDataURL(file);
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setTaskError("");

    // Doble validación en el frontend: aunque se intente enviar el formulario
    // manualmente, no se crea una tarea sin un Check In activo.
    if (!hasActiveCheckIn || evidenceError || creatingTask) return;

    let taskName = customName.trim();
    if (taskType === "pre") {
      const selectedObj = tareasPreestablecidas.find((t) => String(t.id) === String(selectedPreId));
      taskName = selectedObj?.nombre || "Nueva Tarea";
    }

    if (!taskName) return;

    const nuevaTarea = {
      // El backend genera un codigo unico al guardar la tarea.
      nombre: taskName,
      descripcion: descripcion || "Sin descripción",
      tipo: taskType === "pre" ? "Pre-establecida" : "Custom",
      asignadoA: currentUser?.nombre || "Gabriel Chamorro",
      fecha: getLocalDateISO(),
      fechaInicio: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }),
      fechaFin: null,
      fechaLimite: deadline || `${getLocalDateISO()}T18:00`,
      meta: meta || "Completar entregable asignado",
      metaCumplida: false,
      estado: "En Progreso",
      bitacora: bitacoraInput || "Iniciando bloque de trabajo.",
      evidencia: previewImage || null,
    };

    setCreatingTask(true);
    try {
      await onAddTask(nuevaTarea);
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
    setPreviewImage(null);
    setEvidenceError("");
  };

  return (
    <div className="space-y-6">
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
            onClick={onCheckOut}
            disabled={controlesBloqueados || !jornada?.activa}
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
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
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
                  value={selectedPreId}
                  onChange={handlePlantillaChange}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {tareasPreestablecidas.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nombre}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Nombre Tarea</label>
                <input
                  type="text"
                  placeholder="Ej. Análisis de Logs de Servidor"
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
                  min={`${getLocalDateISO()}T00:00`}
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
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

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Evidencia (Imagen opcional)</label>
              <input
                type="file"
                accept="image/png,image/jpeg,image/gif,image/webp"
                onChange={handleImageUpload}
                className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
              {evidenceError && (
                <p className="mt-1 text-[11px] font-medium text-rose-600">{evidenceError}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={!hasActiveCheckIn || creatingTask || Boolean(evidenceError)}
              className={`w-full py-2.5 text-white font-semibold rounded-xl text-xs transition-colors ${
                hasActiveCheckIn && !evidenceError
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

                    {/* Meta y Checkbox */}
                    <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                      <span className="text-slate-600">
                        <strong>Meta:</strong> {task.meta}
                      </span>
                      {!isApproved && !isUnderReview && (
                        <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                          <input
                            type="checkbox"
                            checked={task.metaCumplida || false}
                            onChange={(e) =>
                              onUpdateTask({ ...task, metaCumplida: e.target.checked })
                            }
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          Meta cumplida
                        </label>
                      )}
                    </div>

                    {/* Editor de Bitácora Individual */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="text-[11px] font-bold text-slate-700">Bitácora Individual (Editable en vivo):</label>
                        {!isApproved && !isUnderReview && (
                          <span className="text-[10px] text-indigo-600">Sincronización activa</span>
                        )}
                      </div>
                      <textarea
                        rows={3}
                        disabled={isUnderReview || isApproved}
                        value={task.bitacora || ""}
                        onChange={(e) => onUpdateTask({ ...task, bitacora: e.target.value })}
                        placeholder="Escribe avances o novedades de esta tarea específica..."
                        className={`w-full p-2.5 text-xs rounded-xl border ${
                          isUnderReview || isApproved
                            ? "bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed"
                            : "bg-white border-indigo-200 focus:ring-2 focus:ring-indigo-500"
                        }`}
                      />
                    </div>

                    {/* Botón para enviar a revisión */}
                    {!isApproved && !isUnderReview && (
                      <div className="flex justify-end pt-1">
                        <button
                          onClick={() => onSendToReview(task.id)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs transition-colors shadow-xs cursor-pointer"
                        >
                          Marcar como lista (enviar a aprobación)
                        </button>
                      </div>
                    )}

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
