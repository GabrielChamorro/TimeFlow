// Reglas simples de confirmación usadas por los diálogos administrativos.
// La comparación evita que un espacio accidental o mayúsculas bloqueen una confirmación deliberada.
export function matchesDeactivationTarget(value, expected) {
  if (!expected || typeof expected !== "string" || typeof value !== "string") return false;
  return value.trim().toLocaleLowerCase("es") === expected.trim().toLocaleLowerCase("es");
}

export function canSubmitDeactivation({ kind, step, typed, target }) {
  const finalStep = kind === "account" ? 3 : 2;
  return step === finalStep && matchesDeactivationTarget(typed, target);
}
