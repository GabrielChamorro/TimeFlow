import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createAutoLayout } from '../src/utils/mapLayout.js';

const here = dirname(fileURLToPath(import.meta.url));
const frontend = resolve(here, '..');
const read = path => readFileSync(resolve(frontend, path), 'utf8');

test('el cálculo se importa explícitamente y existe en mapLayout', () => {
  assert.equal(typeof createAutoLayout, 'function');
  assert.match(read('src/pages/MonitoringView.jsx'), /import\s*\{[^}]*createAutoLayout[^}]*\}\s*from\s*["']\.\.\/utils\/mapLayout["']/s);
});

test('se puede aplicar o cancelar sin guardar durante la vista previa', () => {
  const screen = read('src/pages/MonitoringView.jsx');
  assert.match(screen, /setAutoPreview\(\{\s*\.\.\.layout/);
  assert.match(screen, /onClick=\{cancelAutoLayout\}/);
  assert.match(screen, /onClick=\{applyAutoLayout\}/);
  assert.match(screen, /onApplyAutoLayout\(propuestas\)/);
});

test('el guardado utiliza una sola petición y no una petición por nodo', () => {
  const app = read('src/App.jsx');
  assert.match(app, /onApplyAutoLayout=\{demoSprint5 \? undefined : handleApplyAutoLayout\}/);
  assert.match(app, /apiFetch\(`\$\{ENDPOINTS\.TAREAS\}\/posiciones`/);
  const backend = read('../backend/src/main/java/com/teamflow/backend/controllers/TareaController.java');
  assert.match(backend, /@PatchMapping\("\/posiciones"\)/);
  assert.match(backend, /@Transactional\s+public ResponseEntity<\?> actualizarPosicionesMapa/);
  assert.match(backend, /findByIdForUpdate/);
  assert.match(backend, /saveAllAndFlush\(tareas\)/);
});

test('las importaciones locales de Monitor y App apuntan a archivos existentes', () => {
  for (const rel of ['src/pages/MonitoringView.jsx','src/App.jsx']) {
    const content = read(rel);
    for (const match of content.matchAll(/from\s*['"](\.{1,2}\/[^'"]+)['"]/g)) {
      const root = resolve(frontend, dirname(rel), match[1]);
      assert(['','.js','.jsx','.mjs'].some(ext => existsSync(root + ext)), `Importación faltante: ${match[1]} en ${rel}`);
    }
  }
});
