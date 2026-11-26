import React, { useEffect, useMemo, useRef, useState } from "react";
import { getDependencyIds } from "../utils/mapLayout.js";
import PresenceDot from "../components/PresenceDot.jsx";
import { presenceValue } from "../utils/presence.js";
import {
  NODE_WIDTH, buildDependencyCurve, createAutoLayout, createDefaultPositions, createDependencyEdges, dependencyChainIds, fitNodes, isEdgeVisible, isNodeVisible,
} from "../utils/mapLayout";

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

function cubicPoint(p0, p1, p2, p3, t) {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const t2 = t * t;
  return {
    x: mt2 * mt * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t2 * t * p3.x,
    y: mt2 * mt * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t2 * t * p3.y,
  };
}

function cubicTangent(p0, p1, p2, p3, t) {
  const mt = 1 - t;
  return {
    x: 3 * mt * mt * (p1.x - p0.x) + 6 * mt * t * (p2.x - p1.x) + 3 * t * t * (p3.x - p2.x),
    y: 3 * mt * mt * (p1.y - p0.y) + 6 * mt * t * (p2.y - p1.y) + 3 * t * t * (p3.y - p2.y),
  };
}

function buildChevron(point, tangent, size = 10, width = 8) {
  const length = Math.hypot(tangent.x, tangent.y) || 1;
  const ux = tangent.x / length;
  const uy = tangent.y / length;
  const nx = -uy;
  const ny = ux;
  const baseX = point.x - ux * size;
  const baseY = point.y - uy * size;
  return `${baseX + nx * width * 0.5},${baseY + ny * width * 0.5} ${point.x},${point.y} ${baseX - nx * width * 0.5},${baseY - ny * width * 0.5}`;
}

function DependencyArrow({ previous, task, highlighted }) {
  const curve = buildDependencyCurve(previous, task);
  const chevronStops = highlighted ? [0.34, 0.5, 0.66, 0.82] : [0.42, 0.6, 0.78];
  const strokeColor = highlighted ? '#67e8f9' : '#38bdf8';
  const haloColor = highlighted ? '#22d3ee' : '#0f172a';

  return (
    <g className="tf-flow-line">
      <path
        d={curve.d}
        fill="none"
        stroke={haloColor}
        strokeWidth={highlighted ? '8' : '6'}
        strokeOpacity={highlighted ? '0.32' : '0.22'}
        strokeLinecap="round"
      />
      <path
        d={curve.d}
        fill="none"
        stroke={strokeColor}
        strokeWidth={highlighted ? '4.2' : '3.1'}
        strokeOpacity={highlighted ? '0.9' : '0.72'}
        strokeLinecap="round"
        filter="url(#tf-edge-glow)"
      />
      {chevronStops.map((t, index) => {
        const point = cubicPoint(curve.p0, curve.p1, curve.p2, curve.p3, t);
        const tangent = cubicTangent(curve.p0, curve.p1, curve.p2, curve.p3, t);
        return (
          <polyline
            key={`chevron-${previous.id}-${task.id}-${index}`}
            points={buildChevron(point, tangent, highlighted ? 11 : 9, highlighted ? 9 : 7)}
            fill="none"
            stroke={strokeColor}
            strokeWidth={highlighted ? '2.6' : '2.1'}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeOpacity={highlighted ? '0.92' : '0.7'}
            className="tf-flow-chevron"
            style={{ animationDelay: `${index * 180}ms` }}
          />
        );
      })}
      <circle cx={curve.endX} cy={curve.endY} r={highlighted ? '3.8' : '3.1'} fill={strokeColor} fillOpacity={highlighted ? '0.95' : '0.78'} filter="url(#tf-edge-glow)" />
    </g>
  );
}

export default function MonitoringView({
  collaborators = [],
  presence = null,
  tasks = [],
  currentUser,
  onSelectTask,
  onMoveTask,
  onApplyAutoLayout,
  selectedTaskId,
  onClearSelection,
}) {
  const [zoom, setZoom] = useState(0.85);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [draggingNodeId, setDraggingNodeId] = useState(null);
  const [localPositions, setLocalPositions] = useState({});
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedCollaborator, setSelectedCollaborator] = useState("todos");
  const [positionMessage, setPositionMessage] = useState("");
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [autoPreview, setAutoPreview] = useState(null);
  const [previewView, setPreviewView] = useState(null);
  const [autoSaving, setAutoSaving] = useState(false);
  const [savingSingleMove, setSavingSingleMove] = useState(false);
  const [autoError, setAutoError] = useState('');

  const canvasRef = useRef(null);
  const canvasDragStart = useRef({ x: 0, y: 0 });
  const canvasHasMoved = useRef(false);
  const nodeDrag = useRef(null);
  const suppressNodeClick = useRef(null);
  const savingSingleMoveRef = useRef(false);

  const isAdmin = currentUser?.rol?.toLowerCase() === "admin";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const measure = () => {
      const rect = canvas.getBoundingClientRect();
      setCanvasSize((previous) => previous.width === rect.width && previous.height === rect.height
        ? previous : { width: rect.width, height: rect.height });
    };
    measure();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }
    const observer = new ResizeObserver(measure);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

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
    setLocalPositions(previous => {
      const dragging = nodeDrag.current?.id;
      if (dragging && previous[dragging]) storedPositions[dragging] = previous[dragging];
      return savingSingleMoveRef.current ? previous : storedPositions;
    });
  }, [tasks]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && isFullscreen) setIsFullscreen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  const defaultPositions = useMemo(() => createDefaultPositions(tasks), [tasks]);

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
      const position = autoPreview?.positions[key] || local || stored || fallback;
      return { ...task, x: position.x, y: position.y };
    });
  }, [filteredTasks, defaultPositions, localPositions, autoPreview]);

  // Solo montar los nodos visibles, pero mantener conteos y conexiones del mapa completo.
  const visibleTasks = useMemo(() => positionedTasks.filter((task) =>
    (isNodeVisible(task, pan, zoom, canvasSize) || draggingNodeId === String(task.id))), [positionedTasks, pan, zoom, canvasSize, draggingNodeId]);

  const linkedTasks = useMemo(() => {
    const byId = new Map(positionedTasks.map(t => [String(t.id),t]));
    return createDependencyEdges(positionedTasks).flatMap(edge => {
      const previous=byId.get(edge.parentId);
      const task=byId.get(edge.taskId);
      if(!previous || !task) return [];
      return [{ ...edge, previous, task }];
    });
  }, [positionedTasks]);

  const selectedDependencies = useMemo(() => selectedTaskId == null
    ? new Set() : dependencyChainIds(selectedTaskId, tasks), [selectedTaskId, tasks]);

  const visibleEdges = useMemo(() => linkedTasks.filter(({ previous, task }) =>
    isEdgeVisible(previous,task,pan,zoom,canvasSize)), [linkedTasks, pan,zoom,canvasSize]);

  const totalFinalizadas = filteredTasks.filter((task) => task.estado === "Finalizada").length;
  const totalEnRevision = filteredTasks.filter((task) => task.estado === "En Revisión").length;
  const metasCumplidas = filteredTasks.filter((task) => task.metaCumplida).length;

  const fingerprint = () => JSON.stringify(tasks.map(t => [
    t.id, t.fechaLimite, t.fecha, getDependencyIds(t), t.posicionX ?? null, t.posicionY ?? null,
  ]));

  const prepareAutoLayout = () => {
    if (!isAdmin || !onApplyAutoLayout || selectedCollaborator !== 'todos' || autoSaving || savingSingleMove || savingSingleMoveRef.current || draggingNodeId) return;
    setAutoError('');
    try {
      if (tasks.length > 1000) throw new Error('El guardado conjunto admite un máximo de 1000 tareas.');
      const layout = createAutoLayout(tasks);
      if (!layout.total) return;
      setPreviewView({ zoom, pan });
      setAutoPreview({ ...layout, signature: fingerprint() });
      const mapped = tasks.map(task => ({ ...task, ...layout.positions[String(task.id)] }));
      const nextView = fitNodes(mapped, canvasSize);
      setZoom(nextView.zoom);
      setPan(nextView.pan);
      setPositionMessage('');
    } catch (error) {
      setAutoError(error?.message || 'No se pudo calcular la distribución.');
    }
  };

  const cancelAutoLayout = () => {
    if (autoSaving) return;
    if (previewView) {
      setZoom(previewView.zoom);
      setPan(previewView.pan);
    }
    setAutoPreview(null);
    setPreviewView(null);
    setAutoError('');
  };

  const applyAutoLayout = async () => {
    if (!isAdmin || !autoPreview || !onApplyAutoLayout || autoSaving) return;
    if (autoPreview.signature !== fingerprint()) {
      setAutoError('Las tareas cambiaron desde que creaste la vista previa. Cancélala y vuelve a calcular.');
      return;
    }
    const propuestas = tasks.flatMap(task => {
      const position = autoPreview.positions[String(task.id)];
      if (!position) return [];
      const oldX = task.posicionX ?? null;
      const oldY = task.posicionY ?? null;
      if (oldX === position.x && oldY === position.y) return [];
      return [{
        id: task.id, posicionX: position.x, posicionY: position.y,
        anteriorX: oldX, anteriorY: oldY,
      }];
    });
    if (!propuestas.length) {
      setAutoPreview(null);
      setPreviewView(null);
      setPositionMessage('El mapa ya tenía esa distribución.');
      return;
    }
    setAutoSaving(true);
    setAutoError('');
    try {
      const saved = await onApplyAutoLayout(propuestas);
      if (!Array.isArray(saved) || saved.length !== propuestas.length) {
        throw new Error('No se confirmó el guardado de todas las posiciones. Actualiza el mapa antes de reintentar.');
      }
      const newPositions = Object.fromEntries(saved.map(row => [String(row.id), {
        x: row.posicionX, y: row.posicionY,
      }]));
      setLocalPositions(previous => ({ ...previous, ...newPositions }));
      setAutoPreview(null);
      setPreviewView(null);
      setPositionMessage(`${saved.length} posiciones guardadas correctamente.`);
    } catch (error) {
      setAutoError(error?.message || 'No se pudo confirmar el guardado. Actualiza los datos antes de reintentar.');
    } finally {
      setAutoSaving(false);
    }
  };

  const zoomIn = () => setZoom((prev) => Math.min(prev + 0.15, 2.5));
  const zoomOut = () => setZoom((prev) => Math.max(prev - 0.15, 0.15));
  const resetView = () => {
    setZoom(0.85);
    setPan({ x: 0, y: 0 });
  };
  const fitView = () => {
    const next = fitNodes(positionedTasks, canvasSize);
    setZoom(next.zoom);
    setPan(next.pan);
  };

  const handleWheel = (event) => {
    event.preventDefault();
    const delta = event.deltaY < 0 ? 0.08 : -0.08;
    setZoom((prev) => Math.min(Math.max(parseFloat((prev + delta).toFixed(2)), 0.15), 2.5));
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

    if (!isAdmin || autoPreview || autoSaving || savingSingleMoveRef.current) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);

    const point = toCanvasCoordinates(event.clientX, event.clientY);
    const currentPosition = { x: task.x, y: task.y };

    nodeDrag.current = {
      id: String(task.id),
      originalX: currentPosition.x,
      originalY: currentPosition.y,
      storedX: task.posicionX ?? null,
      storedY: task.posicionY ?? null,
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
    savingSingleMoveRef.current = true;
    setSavingSingleMove(true);
    let saved = null;
    try {
      saved = onMoveTask ? await onMoveTask(Number(drag.id), drag.lastX, drag.lastY, drag.storedX, drag.storedY) : null;
    } catch (error) {
      // Una excepción de red o del callback nunca debe dejar el nodo en
      // una posición que no fue confirmada por MySQL.
      console.error("No se pudo guardar el movimiento del nodo:", error);
    } finally {
      savingSingleMoveRef.current = false;
      setSavingSingleMove(false);
    }

    if (!saved) {
      setLocalPositions((prev) => ({
        ...prev,
        [drag.id]: { x: drag.originalX, y: drag.originalY },
      }));
      setPositionMessage("No se pudo guardar la posición. Se restauró la anterior. Actualiza los datos antes de reintentar.");
      return;
    }

    setPositionMessage("Posición guardada.");
    window.setTimeout(() => setPositionMessage((current) => current === "Posición guardada." ? "" : current), 1600);
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
      <details open className="shrink-0 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs" aria-label="Presencia del equipo">
        <summary className="cursor-pointer font-semibold text-slate-700">Presencia laboral del equipo · actualización periódica (5 s)</summary>
        {!presence?.available ? <p role="status" className="mt-2 text-slate-500">Presencia sin datos actualizados. Se reintentará automáticamente.</p>
          : <div className="mt-2 flex max-h-24 flex-wrap gap-2 overflow-auto">{presence.members.filter(member => member.rol.toLowerCase() !== "admin").map(member =>
            <span key={member.id} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-2 py-1">
              <PresenceDot value={member.presente} name={member.nombre}/>{member.nombre}
            </span>)}</div>}
      </details>
      <div className="flex flex-wrap justify-between items-center bg-slate-900 text-white px-5 py-3 rounded-2xl border border-slate-800 shadow-md gap-4">
        <div className="flex items-center gap-3">
          <label className="text-xs text-slate-400 font-semibold">Filtrar por:</label>
          <select
            value={selectedCollaborator}
            disabled={autoSaving}
            onChange={(event) => {
              if (autoSaving) return;
              if (autoPreview) cancelAutoLayout();
              setSelectedCollaborator(event.target.value);
            }}
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
          {selectedTaskId != null && onClearSelection && <button type="button" onClick={onClearSelection} className="rounded-lg border border-cyan-500/40 px-3 py-1.5 text-xs text-cyan-100 hover:bg-slate-700">Quitar resaltado</button>}
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
            <button
              onClick={fitView}
              className="px-2 py-1 text-[11px] rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium transition-colors"
              title="Mostrar todos los nodos en la vista disponible"
            >
              Encajar nodos
            </button>
          </div>

          {isAdmin && onApplyAutoLayout && !autoPreview && (
            <button
              type="button"
              onClick={prepareAutoLayout}
              disabled={autoSaving || savingSingleMove || Boolean(draggingNodeId) || !tasks.length || selectedCollaborator !== 'todos'}
              title={selectedCollaborator !== 'todos' ? 'Selecciona todos los colaboradores antes de autoorganizar.' : 'Previsualizar organización por dependencias y fecha límite'}
              className="rounded-lg border border-cyan-400/45 bg-cyan-500/15 px-3 py-1.5 text-xs font-semibold text-cyan-100 hover:bg-cyan-500/25 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Autoorganizar
            </button>
          )}

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

      <div className="flex flex-wrap gap-3 text-xs text-slate-500 px-2">
        <span>↳ Flecha celeste: dependencia entre tareas</span>
        <span>Línea gris: orden normal del mapa</span>
        {selectedTaskId != null && <span className="font-semibold text-cyan-700">Las tareas previas de la selección se resaltan en celeste.</span>}
      </div>
      {isAdmin && autoPreview && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-cyan-500/40 bg-slate-900 px-4 py-3 text-xs text-cyan-50" role="region" aria-label="Vista previa de organización automática">
          <div className="space-y-1">
            <p className="font-bold text-sm">Vista previa — aún no se ha guardado nada</p>
            <p className="text-slate-300">
              {autoPreview.total} tareas · {autoPreview.relations} dependencias · {autoPreview.levels} niveles.
              Se ordenan por dependencias, fecha límite y cercanía entre tareas relacionadas.
            </p>
            <p className="text-slate-400">Aplicar reemplaza las posiciones del mapa. Cancelar conserva las anteriores.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={autoSaving} onClick={cancelAutoLayout}
              className="rounded-lg border border-slate-600 px-3 py-2 font-semibold text-slate-200 hover:bg-slate-800 disabled:opacity-50">
              Cancelar
            </button>
            <button type="button" disabled={autoSaving} onClick={applyAutoLayout}
              className="rounded-lg bg-cyan-500 px-3 py-2 font-bold text-slate-950 hover:bg-cyan-400 disabled:opacity-60">
              {autoSaving ? 'Guardando posiciones…' : 'Aplicar distribución'}
            </button>
          </div>
        </div>
      )}
      {autoError && <div className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-800" role="alert">{autoError}</div>}
      {isAdmin && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-900">
          <span>
            {autoPreview ? 'Vista previa activa: el arrastre de nodos está pausado hasta aplicar o cancelar.' : 'Puedes arrastrar tareas libremente. Autoorganizar muestra una vista previa y solo guarda al confirmar.'}
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
            <defs>
              <filter id="tf-edge-glow" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="2.2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            {visibleEdges.map(({ task, previous, explicit }) => {
              const highlighted = selectedTaskId != null && explicit &&
                (String(task.id) === String(selectedTaskId) || selectedDependencies.has(String(task.id))) &&
                selectedDependencies.has(String(previous.id));

              if (explicit) {
                return (
                  <DependencyArrow
                    key={`edge-${previous.id}-${task.id}`}
                    previous={previous}
                    task={task}
                    highlighted={highlighted}
                  />
                );
              }

              return (
                <line
                  key={`edge-${previous.id}-${task.id}`}
                  x1={previous.x + NODE_WIDTH / 2}
                  y1={previous.y + 35}
                  x2={task.x + NODE_WIDTH / 2}
                  y2={task.y + 35}
                  stroke="#94a3b8"
                  strokeWidth="1.1"
                  strokeDasharray="4,7"
                  strokeOpacity="0.28"
                />
              );
            })}
          </svg>

          {visibleTasks.map((task) => {
            const isFinished = task.estado === "Finalizada";
            const isReview = task.estado === "En Revisión";
            const isNodeDragging = draggingNodeId === String(task.id);
            const isSelected = selectedTaskId != null && String(selectedTaskId) === String(task.id);
            const isDependency = selectedDependencies.has(String(task.id));

            return (
              <div
                key={task.id}
                role="button"
                tabIndex={0}
                aria-label={`Abrir tarea ${task.nombre}`}
                onClick={() => handleNodeClick(task)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    // El teclado no debe quedar bloqueado por un arrastre anterior del lienzo.
                    onSelectTask?.(task);
                  }
                }}
                onPointerDown={(event) => handleNodePointerDown(event, task)}
                onPointerMove={handleNodePointerMove}
                onPointerUp={handleNodePointerUp}
                onPointerCancel={handleNodePointerUp}
                style={{ left: `${task.x}px`, top: `${task.y}px` }}
                title={isAdmin ? "Arrastra para mover. Haz clic para abrir la tarea." : "Haz clic para abrir la tarea."}
                className={`tf-node absolute w-48 p-3 rounded-xl backdrop-blur-md shadow-lg border z-10 ${
                  isNodeDragging ? "scale-[1.03] ring-2 ring-indigo-300/55" : "transition-all duration-150 hover:scale-[1.02]"
                } ${isSelected ? "tf-node-selected ring-2 ring-white/70 shadow-[0_0_18px_rgba(129,140,248,0.22)] z-30" : isDependency ? "tf-node-dependency ring-2 ring-cyan-300/65 shadow-[0_0_18px_rgba(34,211,238,0.18)] z-20" : ""} ${isAdmin && !autoPreview ? "cursor-move" : "cursor-pointer"} ${
                  isFinished
                    ? "bg-slate-900/90 border-emerald-500/45 hover:border-emerald-400/80 hover:shadow-emerald-500/16"
                    : isReview
                    ? "bg-slate-900/90 border-amber-500/45 hover:border-amber-400/80 hover:shadow-amber-500/16"
                    : "bg-slate-900/90 border-indigo-500/45 hover:border-indigo-400/80 hover:shadow-indigo-500/16"
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

                {getDependencyIds(task).length > 0 && <span className="inline-flex mb-1 text-[9px] px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-200">↳ {getDependencyIds(task).length} {getDependencyIds(task).length === 1 ? "tarea previa" : "tareas previas"}</span>}
                {isDependency && <span className="inline-flex mb-1 text-[9px] px-2 py-0.5 rounded-full bg-cyan-500 text-slate-950 font-bold">Dependencia seleccionada</span>}
                <h4 className="text-xs font-bold text-slate-100 truncate leading-tight" title={task.nombre}>
                  {task.nombre}
                </h4>

                <div className="text-[10px] text-slate-400 mt-1 space-y-0.5">
                  <div>Fecha: <span className="text-slate-300 font-medium">{formatTaskDate(task.fecha)}</span></div>
                  <div>Límite: <span className="text-slate-300 font-medium">{formatDeadline(task.fechaLimite, task.fecha)}</span></div>
                </div>

                <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2 pt-1.5 border-t border-slate-800">
                  <span className="inline-flex items-center gap-1 max-w-[100px]"><PresenceDot value={presenceValue(presence, task.asignadoUsuarioId)} name={task.asignadoA}/><span className="truncate">{task.asignadoA}</span></span>
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
