export const API_URL = "http://localhost:8080";

export const ENDPOINTS = {
  LOGIN: `${API_URL}/api/auth/login`,
  TAREAS: `${API_URL}/api/tareas`,
  JORNADAS: `${API_URL}/api/jornadas`,
  USUARIOS: `${API_URL}/api/usuarios`,
  TIPOS_TAREA: `${API_URL}/api/tipos-tarea`,
  MENSAJES: `${API_URL}/api/mensajes`,
};

// toma el token que se guardo despues del login
export function getToken() {
  return localStorage.getItem("token");
}

// agrega el token a las peticiones que necesiten sesion
export function authHeaders(extraHeaders = {}) {
  const token = getToken();

  return {
    ...extraHeaders,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// usa fetch normal pero agregando automaticamente el jwt
export function apiFetch(url, options = {}) {
  return fetch(url, {
    ...options,
    headers: authHeaders(options.headers || {}),
  });
}
