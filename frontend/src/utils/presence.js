export function validPresence(data) {
  return Number.isFinite(data?.serverNowMs) && Array.isArray(data.members)
    && data.members.every(item => Number.isSafeInteger(item.id) && typeof item.nombre === "string" && typeof item.rol === "string" && typeof item.presente === "boolean");
}
export function presenceValue(snapshot, id) {
  if (!snapshot?.available || id == null) return null;
  return snapshot.members.find(item => String(item.id) === String(id))?.presente ?? false;
}
export function presenceText(value) {
  return value === true ? "En jornada" : value === false ? "Fuera de jornada" : "Presencia sin datos actualizados";
}
