// El reloj de pared del cliente no interviene: el ancla procede del servidor.
const validMs = value => Number.isSafeInteger(value) && value >= 0;
export function clockAnchor(serverNowMs, sentMono, receivedMono) {
  if (!validMs(serverNowMs) || !Number.isFinite(sentMono) || !Number.isFinite(receivedMono) || receivedMono < sentMono) return null;
  return { serverNowMs: serverNowMs + (receivedMono - sentMono) / 2, receivedMono, uncertaintyMs: (receivedMono - sentMono) / 2 };
}
export function taskElapsed(task, anchor, mono) {
  if (!validMs(task?.tiempoAcumuladoMs)) return null;
  if (task.tiempoInicioMs == null) return task.tiempoAcumuladoMs;
  if (!validMs(task.tiempoInicioMs) || !anchor || !Number.isFinite(mono)) return null;
  const serverNow = anchor.serverNowMs + Math.max(0, mono - anchor.receivedMono);
  return task.tiempoAcumuladoMs + Math.max(0, serverNow - task.tiempoInicioMs);
}
export function formatElapsed(ms) {
  if (!Number.isFinite(ms) || ms < 0) return "Tiempo no registrado";
  const s = Math.floor(ms / 1000);
  return [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60].map(v => String(v).padStart(2, "0")).join(":");
}
export function validTaskSync(data) {
  return validMs(data?.serverNowMs) && Array.isArray(data.tasks) && data.tasks.every(t =>
    Number.isSafeInteger(t.id) && t.id > 0 && validMs(t.version) && typeof t.estado === "string" &&
    (t.tiempoAcumuladoMs == null || validMs(t.tiempoAcumuladoMs)) && (t.tiempoInicioMs == null || validMs(t.tiempoInicioMs)) &&
    (t.ultimoRegistroId == null || validMs(t.ultimoRegistroId)));
}
export function taskRefreshNeeded(tasks, remote) {
  if (tasks.length !== remote.length) return true;
  const versions = new Map(tasks.map(t => [String(t.id), t.version]));
  return remote.some(t => !versions.has(String(t.id)) || t.version > versions.get(String(t.id)));
}
// Una consulta iniciada antes del Check-out nunca debe reabrir esa misma jornada.
export function newerJornada(current, incoming) {
  if (!incoming || (current && (incoming.id < current.id || (incoming.id === current.id && !current.activa)))) return current;
  if (current?.id === incoming.id && current.activa === incoming.activa) return current;
  return incoming;
}
