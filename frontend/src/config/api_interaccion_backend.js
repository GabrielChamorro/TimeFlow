import { getToken, getSessionEpoch, restoreSession, invalidateSession } from "./session.js";
export { getToken } from "./session.js";

export const API_URL = import.meta.env?.VITE_API_URL || "http://localhost:8080";

export const ENDPOINTS = {
  LOGOUT: `${API_URL}/api/auth/logout`,
  LOGIN: `${API_URL}/api/auth/login`,
  TAREAS: `${API_URL}/api/tareas`,
  JORNADAS: `${API_URL}/api/jornadas`,
  USUARIOS: `${API_URL}/api/usuarios`,
  TIPOS_TAREA: `${API_URL}/api/tipos-tarea`,
  MENSAJES: `${API_URL}/api/mensajes`,
};


// agrega el token a las peticiones que necesiten sesion
export function authHeaders(extraHeaders = {}) {
  const token = getToken();

  return {
    ...extraHeaders,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// Las API de datos nunca envían cookies. Solo el módulo de sesión usa credentials: include.
export async function apiFetch(url, options = {}) {
  const target = new URL(url, API_URL), base = new URL(API_URL);
  if (target.origin !== base.origin || !target.pathname.startsWith("/api/") || target.pathname.startsWith("/api/auth/"))
    throw new Error("Destino de API no permitido");
  const initialToken = getToken();
  const initialEpoch = getSessionEpoch();
  const send = () => fetch(url, { ...options, credentials: "omit", headers: authHeaders(options.headers || {}) });
  let response = await send();
  if (response.status === 401) {
    if (getSessionEpoch() !== initialEpoch) return response;
    if (getToken() === initialToken && !(await restoreSession())) return response;
    if (getSessionEpoch() !== initialEpoch) return response;
    if (getToken()) response = await send();
    if (response.status === 401 && getSessionEpoch() === initialEpoch) invalidateSession();
  }
  return response;
}
