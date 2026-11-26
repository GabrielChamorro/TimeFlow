import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src');
const file = (name) => fs.readFileSync(path.join(dir, name), 'utf8');

function filesRecursively(folder) {
  return fs.readdirSync(folder, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(folder, entry.name);
    return entry.isDirectory() ? filesRecursively(full) : /\.(js|jsx|mjs)$/.test(entry.name) ? [full] : [];
  });
}

test('todas las importaciones locales del frontend apuntan a archivos existentes', () => {
  const failures = [];
  for (const source of filesRecursively(dir)) {
    const content = fs.readFileSync(source, 'utf8');
    const expression = /\b(?:import|export)\s+(?:[^'";]*?\s+from\s+)?["'](\.[^"']+)["']/g;
    for (const match of content.matchAll(expression)) {
      const target = path.resolve(path.dirname(source), match[1]);
      const variants = [target, `${target}.js`, `${target}.jsx`, `${target}.mjs`, `${target}.json`, path.join(target, 'index.jsx')];
      if (!variants.some((candidate) => fs.existsSync(candidate))) failures.push(`${source}: ${match[1]}`);
    }
  }
  assert.deepEqual(failures, []);
});

test('monitoreo tiene disponibles las constantes usadas para las flechas', () => {
  const content = file('pages/MonitoringView.jsx');
  // La geometría se calcula dentro de mapLayout; Monitoreo solo importa la función exportada.
  assert.match(content, /import\s*\{[^}]*\bbuildDependencyCurve\b[^}]*\}\s*from\s*["']\.\.\/utils\/mapLayout/);
  assert.match(file('utils/mapLayout.js'), /export\s+function\s+buildDependencyCurve\s*\(/);
  assert.match(file('utils/mapLayout.js'), /export\s+const\s+NODE_HEIGHT\s*=/);
});

test('diálogos de administración y tarea usan transiciones de cierre', () => {
  const app = file('App.jsx');
  assert.match(app, /import MotionPresence from "\.\/components\/MotionPresence\.jsx"/);
  assert.match(app, /<MotionPresence show=\{Boolean\(selectedTask\)\}>/);
  for (const view of ['pages/Usuarios.jsx', 'pages/TaskTypesView.jsx']) {
    assert.match(file(view), /import MotionPresence from "\.\.\/components\/MotionPresence\.jsx"/);
    assert.match(file(view), /<MotionPresence show=/);
  }
  assert.match(file('components/MotionPresence.jsx'), /window\.clearTimeout/);
  assert.match(file('components/MotionPresence.jsx'), /aria-hidden=\{leaving/);
});

test('microinteracciones no ralentizan la navegación ni la edición del mapa', () => {
  const css = file('index.css');
  assert.match(css, /\.tf-primary-nav > button\[aria-current="page"\]/);
  assert.match(css, /\.tf-ui-view/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.doesNotMatch(css, /\.tf-node\s*\{[^}]*animation:/);
  const app = file('App.jsx');
  assert.match(app, /<main key=\{activeTab\} className="tf-ui-view">/);
});

test('indicadores de espera están ligados al estado real de la operación', () => {
  assert.match(file('pages/Usuarios.jsx'), /data-loading=\{pending === "guardar"\}/);
  assert.match(file('pages/TaskTypesView.jsx'), /data-loading=\{pending === "crear"\}/);
  assert.match(file('pages/WorkdayView.jsx'), /data-loading=\{creatingTask\}/);
  assert.match(file('App.jsx'), /data-loading=\{refreshing\}/);
});
