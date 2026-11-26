import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getToken, setToken, clearSession, restoreSession, logoutSession } from '../src/config/session.js';
import { apiFetch, API_URL } from '../src/config/api_interaccion_backend.js';

test('sesión en memoria se borra al salir y no reaparece al recargar el módulo', async () => {
  setToken('solo-fixture-sesion');
  assert.equal(getToken(), 'solo-fixture-sesion');
  const reloaded = await import('../src/config/session.js?reload-test');
  assert.equal(reloaded.getToken(), null);
  clearSession();
  assert.equal(getToken(), null);
});
test('respuesta sin token no crea una sesión', () => {
  assert.throws(() => setToken(undefined), /sesión/);
  assert.equal(getToken(), null);
});

test('renovaciones concurrentes comparten una petición y solo auth recibe cookie', async () => {
  const original = globalThis.fetch;
  let count = 0;
  globalThis.fetch = async (url, options) => {
    count++;
    assert.equal(options.credentials, 'include');
    assert.equal(options.headers['X-TimeFlow-CSRF'], '1');
    assert.match(url, /\/api\/auth\/refresh$/);
    await new Promise(resolve => setTimeout(resolve, 10));
    return new Response(JSON.stringify({ token: 'fixture-acceso', user: { id: 1, rol: 'admin' } }), { status: 200 });
  };
  try {
    const results = await Promise.all(Array.from({ length: 12 }, () => restoreSession()));
    assert.equal(count, 1); assert.equal(results.length, 12); assert.equal(getToken(), 'fixture-acceso');
  } finally { globalThis.fetch = original; clearSession(); }
});
test('sesión expirada limpia acceso; fallo de red no simula un logout', async () => {
  const original = globalThis.fetch;
  try {
    setToken('fixture'); globalThis.fetch = async () => new Response('{}', { status: 401 });
    assert.equal(await restoreSession(), null); assert.equal(getToken(), null);
    setToken('fixture'); globalThis.fetch = async () => { throw new Error('offline'); };
    await assert.rejects(restoreSession()); assert.equal(getToken(), 'fixture');
  } finally { globalThis.fetch = original; clearSession(); }
});
test('logout confirmado limpia el acceso y rechaza respuesta malformada de restauración', async () => {
  const original = globalThis.fetch;
  try {
    setToken('fixture'); globalThis.fetch = async () => new Response(null, { status: 204 });
    await logoutSession(); assert.equal(getToken(), null);
    globalThis.fetch = async () => new Response('{"token":"fixture","user":null}', { status: 200 });
    await assert.rejects(restoreSession(), /inválida/); assert.equal(getToken(), null);
  } finally { globalThis.fetch = original; clearSession(); }
});
test('varias API con acceso expirado renuevan una vez y reintentan sin cookies', async () => {
  const original = globalThis.fetch; let refreshes = 0, calls = 0;
  setToken('anterior');
  globalThis.fetch = async (url, options) => {
    if (url.endsWith('/api/auth/refresh')) {
      refreshes++; await new Promise(resolve => setTimeout(resolve, 10));
      return new Response(JSON.stringify({ token: 'nuevo', user: { id: 1, rol: 'admin' } }), { status: 200 });
    }
    calls++; assert.equal(options.credentials, 'omit');
    return new Response('[]', { status: options.headers.Authorization === 'Bearer nuevo' ? 200 : 401 });
  };
  try {
    const responses = await Promise.all(Array.from({ length: 8 }, () => apiFetch(`${API_URL}/api/usuarios`)));
    assert.equal(refreshes, 1); assert.equal(calls, 16); assert.ok(responses.every(response => response.ok));
  } finally { globalThis.fetch = original; clearSession(); }
});
test('un cambio de cuenta evita reenviar una operación antigua con la identidad nueva', async () => {
  const original = globalThis.fetch; let calls = 0; setToken('primera');
  globalThis.fetch = async () => { calls++; clearSession(); setToken('segunda'); return new Response('{}', { status: 401 }); };
  try {
    const response = await apiFetch(`${API_URL}/api/tareas/1`, { method: 'PUT', body: '{}' });
    assert.equal(response.status, 401); assert.equal(calls, 1);
  } finally { globalThis.fetch = original; clearSession(); }
});
test('API rechaza destinos externos y endpoints de cookies fuera del módulo de sesión', async () => {
  await assert.rejects(apiFetch('https://example.test/api/tareas'), /permitido/);
  await assert.rejects(apiFetch(`${API_URL}/api/auth/refresh`), /permitido/);
});
