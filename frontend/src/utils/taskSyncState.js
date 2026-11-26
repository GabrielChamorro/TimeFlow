// Una lectura completa conserva los objetos que no cambiaron, incluidos sus marcadores locales.
// Se comparan también campos privados: una respuesta redactada nunca reutiliza el detalle previo.
function sameTask(previous, incoming) {
  if (previous.version !== incoming.version) return false;
  const keys = Object.keys(incoming).filter(key => key !== "ultimoRegistroId");
  if (Object.keys(previous).filter(key => key !== "ultimoRegistroId").length !== keys.length) return false;
  return keys.every(key => previous[key] === incoming[key] ||
    (Array.isArray(previous[key]) && Array.isArray(incoming[key]) && previous[key].length === incoming[key].length && previous[key].every((v, i) => v === incoming[key][i])));
}
export function reuseUnchangedTasks(previous, incoming) {
  const byId = new Map(previous.map(task => [String(task.id), task]));
  const merged = incoming.map(task => {
    const old = byId.get(String(task.id));
    return old && sameTask(old, task) ? old : task;
  });
  return previous.length === merged.length && merged.every((task, i) => task === previous[i]) ? previous : merged;
}
export function completedTaskSignature(tasks = []) {
  return tasks.filter(task => task.estado === "Finalizada").map(task => String(task.id)).sort().join(",");
}
