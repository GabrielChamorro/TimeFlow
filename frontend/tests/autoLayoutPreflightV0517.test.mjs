import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createAutoLayout, createDefaultPositions, NODE_HEIGHT, NODE_WIDTH } from '../src/utils/mapLayout.js';

const read = (file) => readFileSync(new URL(file, import.meta.url), 'utf8');
const doesNotOverlap = (positions, tasks) => {
  const nodes = tasks.map(t => ({ ...positions[String(t.id)] }));
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i], b = nodes[j];
      assert.ok(a.x + NODE_WIDTH < b.x || b.x + NODE_WIDTH < a.x ||
        a.y + NODE_HEIGHT < b.y || b.y + NODE_HEIGHT < a.y,
        `Nodos ${i + 1} y ${j + 1} se superponen`);
    }
  }
};

test('el autoordenamiento deja espacio vertical para tarjetas con etiquetas adicionales', () => {
  assert.ok(NODE_HEIGHT >= 180);
  const tasks = Array.from({ length: 80 }, (_, i) => ({ id: i + 1, dependenciaIds: [] }));
  doesNotOverlap(createAutoLayout(tasks).positions, tasks);
});

test('la distribución inicial sin dependencias tampoco superpone tarjetas', () => {
  const tasks = Array.from({ length: 40 }, (_, i) => ({ id: i + 1, dependenciaIds: [] }));
  doesNotOverlap(createDefaultPositions(tasks), tasks);
});

test('con muchos requisitos por tarea se conserva separación y dirección', () => {
  const tasks = Array.from({ length: 33 }, (_, i) => ({
    id: i + 1,
    dependenciaIds: i < 10 ? [] : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  }));
  const { positions } = createAutoLayout(tasks);
  doesNotOverlap(positions, tasks);
  assert.ok(positions['10'].x < positions['11'].x);
});

test('el arrastre bloquea movimientos mientras se guarda y revierte incluso ante excepción', () => {
  const source = read('../src/pages/MonitoringView.jsx');
  assert.match(source, /savingSingleMoveRef\.current/);
  assert.match(source, /!isAdmin \|\| autoPreview \|\| autoSaving \|\| savingSingleMoveRef\.current/);
  assert.match(source, /saved = onMoveTask \? await onMoveTask/);
  assert.match(source, /catch \(error\) \{[\s\S]*?console\.error\("No se pudo guardar el movimiento/);
  assert.match(source, /\[drag\.id\]: \{ x: drag\.originalX, y: drag\.originalY \}/);
});

test('el backend valida las coordenadas manuales como en el guardado conjunto', () => {
  const source = read('../../backend/src/main/java/com/teamflow/backend/controllers/TareaController.java');
  assert.match(source, /posicion == null \? null : posicion\.get\("posicionX"\)/);
  assert.match(source, /Math\.abs\(posicionX\) > 10_000_000/);
  assert.match(source, /Math\.abs\(posicionY\) > 10_000_000/);
});
