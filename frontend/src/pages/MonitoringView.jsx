import React, { useEffect, useMemo, useRef, useState } from "react";

const NODE_WIDTH = 192;
const NODE_HEIGHT = 108;

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

export default function MonitoringView({
  collaborators = [],
  tasks = [],
  currentUser,
  onSelectTask,
  onMoveTask,
}) {
  const [zoom, setZoom] = useState(0.85);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [draggingNodeId, setDraggingNodeId] = useState(null);
  const [localPositions, setLocalPositions] = useState({});
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedCollaborator, setSelectedCollaborator] = useState("todos");
  const [positionMessage, setPositionMessage] = useState("");

  const canvasRef = useRef(null);
  const canvasDragStart = useRef({ x: 0, y: 0 });
  const canvasHasMoved = useRef(false);
  const nodeDrag = useRef(null);
  const suppressNodeClick = useRef(null);

  const isAdmin = currentUser?.rol?.toLowerCase() === "admin";

  useEffect(() => {
    const storedPositions = {};
    tasks.forEach((task) => {
      if (Number.isFinite(task.posicionX) && Number.isFinite(task.posicionY)) {
        storedPositions[String(task.id)] = {
          x: task.posicionX,
          y: task.posicionY,
        };
      }
    });
    setLocalPositions(storedPositions);
  }, [tasks]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && isFullscreen) setIsFullscreen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  const defaultPositions = useMemo(() => {
    const positions = {};
    tasks.forEach((task, index) => {
      const angle = index * 1.35;
      const radius = 140 + index * 45;
      positions[String(task.id)] = {
        x: 750 + radius * Math.cos(angle),
        y: 450 + radius * Math.sin(angle),
      };
    });
    return positions;
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    if (selectedCollaborator === "todos") return tasks;
    return tasks.filter((task) => task.asignadoA === selectedCollaborator);
  }, [tasks, selectedCollaborator]);

  const positionedTasks = useMemo(() => {
    return filteredTasks.map((task) => {
      const key = String(task.id);
      const fallback = defaultPositions[key] || { x: 750, y: 450 };
      const local = localPositions[key];
      const stored =
        Number.isFinite(task.posicionX) && Number.isFinite(task.posicionY)
          ? { x: task.posicionX, y: task.posicionY }
          : null;
      const position = local || stored || fallback;
      return { ...task, x: position.x, y: position.y };
    });
  }, [filteredTasks, defaultPositions, localPositions]);

  const totalFinalizadas = filteredTasks.filter((task) => task.estado === "Finalizada").length;
  const totalEnRevision = filteredTasks.filter((task) => task.estado === "En Revisión").length;
  const metasCumplidas = filteredTasks.filter((task) => task.metaCumplida).length;

  const zoomIn = () => setZoom((prev) => Math.min(prev + 0.15, 2.5));
  const zoomOut = () => setZoom((prev) => Math.max(prev - 0.15, 0.3));
  const resetView = () => {
    setZoom(0.85);
    setPan({ x: 0, y: 0 });
  };

  const handleWheel = (event) => {
    event.preventDefault();
    const delta = event.deltaY < 0 ? 0.08 : -0.08;
    setZoom((prev) => Math.min(Math.max(parseFloat((prev + delta).toFixed(2)), 0.3), 2.5));
  };

  const handleCanvasPointerDown = (event) => {
    if (event.button !== 0 || nodeDrag.current) return;
    setIsDraggingCanvas(true);
    canvasHasMoved.current = false;
    canvasDragStart.current = {
      x: event.clientX - pan.x,
      y: event.clientY - pan.y,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handleCanvasPointerMove = (event) => {
    if (!isDraggingCanvas || nodeDrag.current) return;
    const nextPan = {
      x: event.clientX - canvasDragStart.current.x,
      y: event.clientY - canvasDragStart.current.y,
    };
    if (Math.abs(nextPan.x - pan.x) > 1 || Math.abs(nextPan.y - pan.y) > 1) {
      canvasHasMoved.current = true;
    }
    setPan(nextPan);
  };

  const handleCanvasPointerUp = (event) => {
    setIsDraggingCanvas(false);
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const toCanvasCoordinates = (clientX, clientY) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (clientX - rect.left - pan.x) / zoom,
      y: (clientY - rect.top - pan.y) / zoom,
    };
  };

  const handleNodePointerDown = (event, task) => {
    if (event.button !== 0) return;

    canvasHasMoved.current = false;
    event.stopPropagation();

    if (!isAdmin) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);

    const point = toCanvasCoordinates(event.clientX, event.clientY);
    const currentPosition = { x: task.x, y: task.y };

    nodeDrag.current = {
      id: String(task.id),
      originalX: currentPosition.x,
      originalY: currentPosition.y,
      lastX: currentPosition.x,
      lastY: currentPosition.y,
      offsetX: point.x - currentPosition.x,
      offsetY: point.y - currentPosition.y,
      moved: false,
    };

    suppressNodeClick.current = null;
    setDraggingNodeId(String(task.id));
    setPositionMessage("");
  };

  const handleNodePointerMove = (event) => {
    const drag = nodeDrag.current;
    if (!drag) return;

    event.preventDefault();
    event.stopPropagation();

    const point = toCanvasCoordinates(event.clientX, event.clientY);
    // El mapa usa coordenadas de mundo sin límites artificiales.
    // Se permiten valores positivos y negativos para que el administrador
    // pueda distribuir tareas indefinidamente y recuperarlas desplazando el mapa.
    const x = Math.round(point.x - drag.offsetX);
    const y = Math.round(point.y - drag.offsetY);

    if (Math.abs(x - drag.originalX) > 3 || Math.abs(y - drag.originalY) > 3) {
      drag.moved = true;
    }
    drag.lastX = x;
    drag.lastY = y;

    setLocalPositions((prev) => ({
      ...prev,
      [drag.id]: { x, y },
    }));
  };

  const handleNodePointerUp = async (event) => {
    const drag = nodeDrag.current;
    if (!drag) return;

    event.preventDefault();
    event.stopPropagation();
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    nodeDrag.current = null;
    setDraggingNodeId(null);

    if (!drag.moved) return;

    suppressNodeClick.current = drag.id;
    const saved = onMoveTask ? await onMoveTask(Number(drag.id), drag.lastX, drag.lastY) : null;

    if (!saved) {
      setLocalPositions((prev) => ({
        ...prev,
        [drag.id]: { x: drag.originalX, y: drag.originalY },
      }));
      setPositionMessage("No se pudo guardar la posición de la tarea.");
      return;
    }

    setPositionMessage("Posición guardada.");
    window.setTimeout(() => setPositionMessage(""), 1600);
  };

  const handleNodeClick = (task) => {
    const key = String(task.id);
    if (suppressNodeClick.current === key) {
      suppressNodeClick.current = null;
      return;
    }
    if (!canvasHasMoved.current && onSelectTask) onSelectTask(task);
  };

  return (
    <div
      className={
        isFullscreen
          ? "fixed inset-0 z-50 bg-slate-950 p-4 flex flex-col space-y-3 overflow-hidden"
          : "space-y-4"
      }
    >
      <div className="flex flex-wrap justify-between items-center bg-slate-900 text-white px-5 py-3 rounded-2xl border border-slate-800 shadow-md gap-4">
        <div className="flex items-center gap-3">
          <label className="text-xs text-slate-400 font-semibold">Filtrar por:</label>
          <select
            value={selectedCollaborator}
            onChange={(event) => setSelectedCollaborator(event.target.value)}
            className="bg-slate-800 text-slate-200 border border-slate-700 text-xs px-3 py-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="todos">Todos los colaboradores ({tasks.length})</option>
            {collaborators.map((collaborator) => (
              <option key={collaborator.id} value={collaborator.nombre}>
                {collaborator.nombre}
              </option>
            ))}
          </select>
          {isAdmin && (
            <span className="text-[10px] font-semibold uppercase tracking-wide text-indigo-200 bg-indigo-500/15 border border-indigo-400/30 px-2.5 py-1 rounded-full">
              Edición de mapa habilitada
            </span>
          )}
        </div>

        <div className="flex items-center gap-5 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Total nodos</span>
            <span className="text-base font-bold text-slate-100">{filteredTasks.length}</span>
          </div>
          <div className="h-6 w-px bg-slate-800" />
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">En revisión</span>
            <span className="text-base font-bold text-amber-400">{totalEnRevision}</span>
          </div>
          <div className="h-6 w-px bg-slate-800" />
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Aprobadas</span>
            <span className="text-base font-bold text-emerald-400">{totalFinalizadas}</span>
          </div>
          <div className="h-6 w-px bg-slate-800" />
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Metas</span>
            <span className="text-base font-bold text-indigo-400">{metasCumplidas}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
            <button
              onClick={zoomOut}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-700 text-slate-200 font-bold transition-colors"
              aria-label="Alejar mapa"
            >
              −
            </button>
            <span className="text-xs font-mono px-1 text-slate-300 font-semibold w-12 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={zoomIn}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-700 text-slate-200 font-bold transition-colors"
              aria-label="Acercar mapa"
            >
              +
            </button>
            <button
              onClick={resetView}
              className="px-2 py-1 text-[11px] rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium transition-colors"
            >
              Restablecer vista
            </button>
          </div>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors ${
              isFullscreen
                ? "bg-rose-600 border-rose-500 hover:bg-rose-700 text-white"
                : "bg-indigo-600 border-indigo-500 hover:bg-indigo-700 text-white shadow-xs"
            }`}
          >
            {isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
          </button>
        </div>
      </div>

      {isAdmin && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-900">
          <span>
            Como administrador puedes arrastrar las tareas libremente por un mapa sin límites. La posición se guarda en la base de datos y se mantiene al volver a entrar.
          </span>
          {positionMessage && <span className="font-semibold">{positionMessage}</span>}
        </div>
      )}

      <div
        ref={canvasRef}
        onWheel={handleWheel}
        onPointerDown={handleCanvasPointerDown}
        onPointerMove={handleCanvasPointerMove}
        onPointerUp={handleCanvasPointerUp}
        onPointerCancel={handleCanvasPointerUp}
        className={`relative w-full bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-inner select-none touch-none ${
          isFullscreen ? "flex-1 min-h-0" : "h-[640px]"
        } ${isDraggingCanvas ? "cursor-grabbing" : "cursor-grab"}`}
      >
        <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:28px_28px] opacity-40 pointer-events-none" />

        {positionedTasks.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-500 pointer-events-none">
            No hay tareas para mostrar con el filtro actual.
          </div>
        )}

        <div
          className={`absolute inset-0 min-w-[1600px] min-h-[1100px] origin-top-left ${
            isDraggingCanvas ? "transition-none" : "transition-transform duration-100 ease-out"
          }`}
          style={{
            transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
            transformOrigin: "0 0",
            willChange: "transform",
          }}
        >
          <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none">
            {positionedTasks.map((task, index) => {
              if (index === 0) return null;
              const previous = positionedTasks[index - 1];
              return (
                <line
                  key={`line-${task.id || index}`}
                  x1={previous.x + NODE_WIDTH / 2}
                  y1={previous.y + 35}
                  x2={task.x + NODE_WIDTH / 2}
                  y2={task.y + 35}
                  stroke={
                    task.estado === "Finalizada"
                      ? "#10b981"
                      : task.estado === "En Revisión"
                      ? "#f59e0b"
                      : "#6366f1"
                  }
                  strokeWidth="1.5"
                  strokeDasharray="4,4"
                  strokeOpacity="0.5"
                />
              );
            })}
          </svg>

          {positionedTasks.map((task) => {
            const isFinished = task.estado === "Finalizada";
            const isReview = task.estado === "En Revisión";
            const isNodeDragging = draggingNodeId === String(task.id);

            return (
              <div
                key={task.id}
                onClick={() => handleNodeClick(task)}
                onPointerDown={(event) => handleNodePointerDown(event, task)}
                onPointerMove={handleNodePointerMove}
                onPointerUp={handleNodePointerUp}
                onPointerCancel={handleNodePointerUp}
                style={{ left: `${task.x}px`, top: `${task.y}px` }}
                title={isAdmin ? "Arrastra para mover. Haz clic para abrir la tarea." : "Haz clic para abrir la tarea."}
                className={`absolute w-48 p-3 rounded-xl backdrop-blur-md shadow-lg border z-10 ${
                  isNodeDragging ? "scale-[1.03] ring-2 ring-indigo-300/70" : "transition-all duration-150 hover:scale-105"
                } ${isAdmin ? "cursor-move" : "cursor-pointer"} ${
                  isFinished
                    ? "bg-slate-900/90 border-emerald-500/50 hover:border-emerald-400 hover:shadow-emerald-500/20"
                    : isReview
                    ? "bg-slate-900/90 border-amber-500/50 hover:border-amber-400 hover:shadow-amber-500/20"
                    : "bg-slate-900/90 border-indigo-500/50 hover:border-indigo-400 hover:shadow-indigo-500/20"
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span className="text-[10px] font-mono font-bold text-slate-400">
                    {task.codigo || `NODE-${task.id}`}
                  </span>
                  <span className="flex items-center gap-1">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isFinished
                          ? "bg-emerald-400 shadow-[0_0_8px_#34d399]"
                          : isReview
                          ? "bg-amber-400 shadow-[0_0_8px_#fbbf24]"
                          : "bg-indigo-400 shadow-[0_0_8px_#818cf8]"
                      }`}
                    />
                    <span className="text-[9px] font-semibold text-slate-300">{task.estado}</span>
                  </span>
                </div>

                <h4 className="text-xs font-bold text-slate-100 truncate leading-tight" title={task.nombre}>
                  {task.nombre}
                </h4>

                <div className="text-[10px] text-slate-400 mt-1 space-y-0.5">
                  <div>Fecha: <span className="text-slate-300 font-medium">{formatTaskDate(task.fecha)}</span></div>
                  <div>Límite: <span className="text-slate-300 font-medium">{formatDeadline(task.fechaLimite, task.fecha)}</span></div>
                </div>

                <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2 pt-1.5 border-t border-slate-800">
                  <span className="truncate max-w-[90px]">{task.asignadoA}</span>
                  <span className={task.metaCumplida ? "text-emerald-400 font-bold" : "text-amber-400 font-medium"}>
                    {task.metaCumplida ? "Meta cumplida" : "Meta pendiente"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
