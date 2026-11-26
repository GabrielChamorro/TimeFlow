// Peticiones antiguas o respuestas mal formadas nunca deben reemplazar datos de sesión.
export const sessionIsCurrent = (expected, current) => expected === current;

export function ensureListPayload(value, recurso = "datos") {
  if (!Array.isArray(value)) {
    throw new Error(`El servidor entregó un formato inválido para ${recurso}`);
  }
  // Eliminar registros nulos que podrían bloquear vistas que recorren objetos.
  return value.filter(item => item != null && typeof item === "object" && !Array.isArray(item));
}
