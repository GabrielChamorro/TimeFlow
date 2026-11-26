/**
 * TimeFlow V0.5.3 - Medidor Sprint 5.
 * Usa solo GET, sin dependencias npm. No muestra ni guarda correo, password ni JWT.
 * Ejecutar mediante EJECUTAR_PRUEBAS_SPRINT5.bat.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';

const THIS_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(THIS_DIR, '..');
const REPORT_DIR = path.join(ROOT_DIR, 'Resultados_Sprint5');
const rawToken = process.env.TIMEFLOW_S5_JWT;
delete process.env.TIMEFLOW_S5_JWT;

const args = process.argv.slice(2);
function option(name, defaultValue) {
  const ix = args.indexOf(name);
  if (ix === -1) return defaultValue;
  if (ix + 1 >= args.length || args[ix + 1].startsWith('--')) throw new Error(`Falta el valor de ${name}`);
  return args[ix + 1];
}
const quick = args.includes('--quick');
const testConfigs = quick ? [
  {label: 'Secuencial', count: 3, concurrency: 1},
  {label: 'Concurrente 2', count: 8, concurrency: 2},
  {label: 'Concurrente 4', count: 8, concurrency: 4}
] : [
  {label: 'Secuencial', count: 20, concurrency: 1},
  {label: 'Concurrente 4', count: 32, concurrency: 4},
  {label: 'Concurrente 8', count: 40, concurrency: 8}
];
const endpoints = [
  { name: 'Tareas', path: '/api/tareas' },
  { name: 'Mensajes', path: '/api/mensajes' },
  { name: 'Usuarios', path: '/api/usuarios' },
  { name: 'Plantillas', path: '/api/tipos-tarea' }
];
let baseURL;
try {
  baseURL = new URL(option('--base-url', 'http://127.0.0.1:8080'));
  if (!['http:', 'https:'].includes(baseURL.protocol) ||
    !['localhost', '127.0.0.1', '[::1]'].includes(baseURL.hostname) ||
    baseURL.username || baseURL.password || baseURL.pathname !== '/' || baseURL.search || baseURL.hash) {
    throw new Error('Solo se permite un backend local sin rutas ni parametros.');
  }
} catch (error) {
  console.error(`[ERROR] URL no valida: ${error.message}`);
  process.exit(2);
}
if (!rawToken || rawToken.length < 20) {
  console.error('[ERROR] No se recibio un token de sesion valido. Usa el lanzador .bat.');
  process.exit(2);
}
const token = rawToken;

const report = [];
const started = new Date();
const stamp = started.toISOString().replace(/[-:]/g, '').replace('T', '_').replace('Z','').replace('.', '_');
const filename = `TimeFlow_Sprint5_Resultados_${stamp}.txt`;
let failures = 0;
function add(line = '') { report.push(line); }
function rounded(n) { return Number.isFinite(n) ? `${n.toFixed(1)} ms` : 'N/D'; }
function percentile(nums, p) {
  if (!nums.length) return NaN;
  const sorted = [...nums].sort((a,b) => a-b);
  return sorted[Math.ceil(p*sorted.length) - 1];
}
function summarize(rows, wallMs, maxActive) {
  const good = rows.filter(x=>x.status === 200);
  const times = good.map(x=>x.ms);
  const groups = new Map();
  for (const row of rows) {
    const key = String(row.status);
    groups.set(key, (groups.get(key) ?? 0) + 1);
  }
  return {
    total: rows.length, ok: good.length, errors: rows.length - good.length,
    p50: percentile(times, 0.5), p95: percentile(times, 0.95),
    max: times.length ? Math.max(...times) : NaN,
    avg: times.length ? times.reduce((a,b)=>a+b,0) / times.length : NaN,
    wall: wallMs, maxActive,
    rps: wallMs > 0 ? rows.length/(wallMs/1000) : 0,
    status: [...groups.entries()].sort().map(([k,v]) => `${k}=${v}`).join(', ')
  };
}
async function once(endpoint) {
  const start = performance.now();
  try {
    // No se permiten redirecciones: evita que un backend mal configurado mande el JWT a otro host.
    const response = await fetch(new URL(endpoint.path, baseURL), {
      method: 'GET',
      headers: {Authorization: `Bearer ${token}`, 'Cache-Control': 'no-cache', Accept:'application/json'},
      redirect: 'manual',
      signal: AbortSignal.timeout(12000)
    });
    await response.arrayBuffer(); // Medir respuesta completa, no solo sus cabeceras.
    return {status: response.status, ms: performance.now() - start};
  } catch (e) {
    return {status: e?.name === 'TimeoutError' || e?.name === 'AbortError' ? 'TIMEOUT' : 'NETWORK_ERROR',
      ms: performance.now()-start};
  }
}
async function runGroup(endpoint, config) {
  let next = 0, active = 0, maxActive = 0;
  const results = Array(config.count);
  const start = performance.now();
  async function worker() {
    while (next < config.count) {
      const index = next++;
      active++;
      maxActive = Math.max(maxActive, active);
      try { results[index] = await once(endpoint); }
      finally { active--; }
    }
  }
  await Promise.all(Array.from({length: Math.min(config.count, config.concurrency)}, worker));
  return summarize(results, performance.now()-start, maxActive);
}
async function save() {
  await mkdir(REPORT_DIR, {recursive: true});
  const dest = path.join(REPORT_DIR, filename);
  await writeFile(dest, report.join('\r\n') + '\r\n', 'utf8');
  console.log(`\nARCHIVO PARA ENVIAR:\n${dest}`);
}
async function main() {
  add('TIMEFLOW V0.5.3 - SPRINT 5');
  add('REPORTE DE RENDIMIENTO Y LECTURAS SIMULTANEAS');
  add('================================================');
  add(`Fecha: ${started.toISOString()}`);
  add(`Backend local: ${baseURL.origin}`);
  add(`Node: ${process.version}`);
  add('Solo GET autenticados. No contiene datos personales, JWT ni contrasenas.');
  add('NOTA: el inicio de sesion puede renovar un hash de contrasena antiguo si procede.');
  add('');
  add('Criterio operativo: HTTP 200 en todas las consultas.');
  add('Los tiempos NO tienen un umbral formal previamente aprobado.');
  add('');
  console.log('Comprobando sesion y rutas...');
  for (const endpoint of endpoints) {
    const probe = await once(endpoint);
    if (probe.status !== 200) {
      failures++;
      add(`[ERROR] ${endpoint.name} (${endpoint.path}): respuesta ${probe.status}.`);
      add('No se realizaron pruebas de carga para evitar resultados falsos.');
      add('Revisa la sesion, los permisos y que el backend este iniciado.');
      await save();
      return 1;
    }
  }
  add('Comprobacion inicial de las 4 rutas: HTTP 200.');
  add('');
  for (const endpoint of endpoints) {
    add(`RUTA: ${endpoint.name} (${endpoint.path})`);
    console.log(`Midiendo ${endpoint.name}...`);
    for (const config of testConfigs) {
      const s = await runGroup(endpoint, config);
      failures += s.errors;
      add(`  ${config.label}: ${s.ok}/${s.total} OK | En paralelo max. ${s.maxActive} | ` +
        `p50 ${rounded(s.p50)} | p95 ${rounded(s.p95)} | media ${rounded(s.avg)} | max. ${rounded(s.max)} | ` +
        `duracion ${Math.round(s.wall)} ms | ${s.rps.toFixed(1)} pet/s`);
      add(`    Respuestas: ${s.status}`);
      console.log(`  ${config.label}: ${s.ok}/${s.total} correctas, p95=${rounded(s.p95)}`);
    }
    add('');
  }
  // Asegurar que el backend sigue funcionando al finalizar todas las pruebas.
  let finalOk=0;
  for (const endpoint of endpoints) {
    const after = await once(endpoint);
    if (after.status === 200) finalOk++; else {failures++; add(`ERROR posterior ${endpoint.name}: ${after.status}`);}
  }
  add(`Comprobacion final: ${finalOk}/${endpoints.length} rutas siguen respondiendo HTTP 200.`);
  add('');
  add(failures === 0 ? 'RESULTADO OPERATIVO: SIN ERRORES HTTP.' : `RESULTADO OPERATIVO: ${failures} errores o respuestas no esperadas.`);
  add('Interpretacion: son mediciones locales de lecturas simultaneas.');
  add('No comprueban escrituras concurrentes, integridad transaccional ni FPS del navegador.');
  add('No permiten afirmar que se cumpla un objetivo de latencia no definido.');
  await save();
  return failures === 0 ? 0 : 1;
}
try {
  const exitCode = await main();
  process.exitCode = exitCode;
} catch (error) {
  add(`ERROR inesperado del medidor: ${String(error.message).slice(0, 220)}`);
  try { await save(); } catch {console.error('No se pudo guardar el informe.');}
  console.error('[ERROR] Fallo interno del medidor.');
  process.exitCode = 1;
}
