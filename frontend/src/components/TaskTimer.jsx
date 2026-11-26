import { useContext, useSyncExternalStore } from "react";
import { TaskClockContext } from "../config/taskClockContext.js";
import { taskElapsed, formatElapsed } from "../utils/taskClock.js";

// Un solo intervalo compartido; solo los textos de cronómetro se actualizan cada segundo.
const listeners = new Set();
let interval, tick = 0;
function subscribe(listener) {
  listeners.add(listener);
  if (!interval) {
    tick = performance.now();
    interval = window.setInterval(() => { tick = performance.now(); listeners.forEach(fn => fn()); }, 1000);
  }
  return () => { listeners.delete(listener); if (!listeners.size) { window.clearInterval(interval); interval = null; } };
}
const idleSubscribe = () => () => {};
const getTick = () => tick;
export default function TaskTimer({ task }) {
  const sync = useContext(TaskClockContext);
  const remote = sync?.tasks.find(t => String(t.id) === String(task.id));
  const clock = remote && remote.version >= task.version ? remote : task;
  const running = clock.tiempoAcumuladoMs != null && clock.tiempoInicioMs != null;
  const mono = useSyncExternalStore(running ? subscribe : idleSubscribe, getTick);
  const elapsed = taskElapsed(clock, sync?.anchor, Math.max(mono, sync?.receivedMono || 0));
  const label = clock.tiempoAcumuladoMs == null ? "Tiempo no registrado" : elapsed == null ? "Sincronizando tiempo…" : formatElapsed(elapsed);
  return <p className="text-xs text-slate-600 tabular-nums" aria-label={`Tiempo de ${task.nombre}`}>
    <span className="font-mono font-semibold">{label}</span>
    {elapsed != null && <span className="ml-2 text-[10px]">{running ? "En progreso" : "Detenido"}{sync?.available === false ? " · Sin conexión" : ""}</span>}
  </p>;
}
