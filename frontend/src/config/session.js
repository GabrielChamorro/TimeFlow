let token = null;
let refreshFlight = null;
let epoch = 0;
const API = import.meta.env?.VITE_API_URL || "http://localhost:8080";
export const getToken = () => token;
export const getSessionEpoch = () => epoch;
export function setToken(value) {
  if (typeof value !== "string" || !value) throw new Error("La sesión recibida no es válida");
  token = value;
}
export function clearSession() { epoch += 1; token = null; }
const ended = () => { clearSession(); if (typeof window !== "undefined") window.dispatchEvent(new Event("timeflow-session-ended")); };
export const invalidateSession = ended;

async function authRequest(path, data) {
  if (typeof window !== "undefined") {
    const local = host => ["localhost", "127.0.0.1", "[::1]"].includes(host);
    const apiHost = new URL(API).hostname;
    if ((local(apiHost) || local(window.location.hostname)) && apiHost !== window.location.hostname)
      throw new Error("Usa el mismo nombre de host en frontend y API: localhost con localhost, o 127.0.0.1 con 127.0.0.1.");
  }
  const response = await fetch(`${API}/api/auth/${path}`, {
    method: "POST", credentials: "include", cache: "no-store",
    headers: { "Content-Type": "application/json", "X-TimeFlow-CSRF": "1" },
    ...(data ? { body: JSON.stringify(data) } : {}),
  });
  const body = await response.json().catch(() => null);
  return { response, body };
}
const validate = data => {
  if (!data || typeof data.token !== "string" || !data.token || !data.user || !data.user.id || !["admin", "trabajador"].includes(data.user.rol))
    throw new Error("Respuesta de sesión inválida");
  return data;
};
export async function loginSession(email, password) {
  const { response, body } = await authRequest("login", { email, password });
  if (!response.ok) throw new Error(body?.message || "No se pudo iniciar sesión");
  const data = validate(body); epoch += 1; setToken(data.token); return data;
}
export function restoreSession() {
  if (refreshFlight) return refreshFlight;
  const currentEpoch = epoch;
  const work = async () => {
    let result = await authRequest("refresh");
    if (result.response.status === 409) {
      // La respuesta ganadora ya actualiza la cookie compartida. Un único reintento.
      await new Promise(resolve => setTimeout(resolve, 100));
      result = await authRequest("refresh");
    }
    if (currentEpoch !== epoch) return null;
    if (result.response.status === 401) { ended(); return null; }
    if (!result.response.ok) throw new Error(result.body?.message || "No se pudo recuperar la sesión");
    const data = validate(result.body); setToken(data.token); return data;
  };
  // Entre pestañas del mismo origen, la cookie se lee dentro del bloqueo compartido.
  const run = typeof navigator !== "undefined" && navigator.locks?.request
    ? () => navigator.locks.request(`timeflow-refresh:${API}`, work) : work;
  refreshFlight = run().finally(() => { refreshFlight = null; });
  return refreshFlight;
}
export async function logoutSession() {
  const { response } = await authRequest("logout");
  if (!response.ok) throw new Error("No se pudo confirmar el cierre de sesión. Reintenta cuando haya conexión.");
  ended();
}
if (typeof window !== "undefined") {
  try { window.localStorage.removeItem("token"); window.localStorage.removeItem("currentUser"); } catch { /* almacenamiento bloqueado */ }
}
