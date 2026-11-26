import test from 'node:test';
import assert from 'node:assert/strict';
import { createAutoLayout, NODE_WIDTH, NODE_HEIGHT } from '../src/utils/mapLayout.js';

const fixture = [
  { id: 1, nombre: 'Inicio A', dependenciaIds: [], fechaLimite: '2026-11-13T18:00' },
  { id: 2, nombre: 'Inicio B', dependenciaIds: [], fechaLimite: '2026-11-10T18:00' },
  { id: 3, nombre: 'Intermedia', dependenciaIds: [1, 2], fechaLimite: '2026-11-14T18:00' },
  { id: 4, nombre: 'Final', dependenciaIds: [3], fechaLimite: '2026-11-15T18:00' },
];

test('todas las dependencias quedan a la izquierda de la tarea dependiente', () => {
  const { positions, levels, relations } = createAutoLayout(fixture);
  assert.equal(levels, 3);
  assert.equal(relations, 3);
  for (const [parent, child] of [[1, 3], [2, 3], [3, 4]]) {
    assert(positions[parent].x + NODE_WIDTH < positions[child].x);
  }
});

test('fecha límite ascendente dentro de cada nivel', () => {
  const { positions } = createAutoLayout(fixture);
  assert(positions['2'].y < positions['1'].y);
});

test('nodos sin superposiciones, incluso con 100 tareas sin dependencias', () => {
  const tasks = Array.from({ length: 100 }, (_, i) => ({ id: i + 1, dependenciaIds: [] }));
  const { positions } = createAutoLayout(tasks);
  const coords = Object.values(positions);
  assert.equal(coords.length, 100);
  for (let i = 0; i < coords.length; i++) for (let j = i + 1; j < coords.length; j++) {
    const a = coords[i], b = coords[j];
    assert(a.x + NODE_WIDTH < b.x || b.x + NODE_WIDTH < a.x ||
      a.y + NODE_HEIGHT < b.y || b.y + NODE_HEIGHT < a.y);
  }
});

test('respeta dependencias ocultas sin inventar tareas', () => {
  const { positions, relations } = createAutoLayout([
    { id: 1, dependenciaIds: [999] },
    { id: 2, dependenciaIds: [1] },
  ]);
  assert.equal(relations, 1);
  assert.deepEqual(Object.keys(positions).sort(), ['1', '2']);
  assert(positions['1'].x < positions['2'].x);
});

test('rechaza ciclos reales sin colgar la interfaz', () => {
  assert.throws(() => createAutoLayout([
    { id: 1, dependenciaIds: [2] },
    { id: 2, dependenciaIds: [1] },
  ]), /ciclo de dependencias/);
});

test('los mismos datos producen siempre las mismas posiciones', () => {
  assert.deepEqual(createAutoLayout([...fixture].reverse()).positions, createAutoLayout(fixture).positions);
});

test('funciona con cadena larga sin recursión', () => {
  const chain = Array.from({ length: 1500 }, (_, i) => ({ id: i + 1, dependenciaIds: i ? [i] : [] }));
  const { positions, levels } = createAutoLayout(chain);
  assert.equal(levels, 1500);
  assert(positions['1500'].x > positions['1499'].x);
});

test('no modifica datos de entrada ni posiciones manuales', () => {
  const input = fixture.map(t => ({ ...t, posicionX: -100, posicionY: 300 }));
  const before = JSON.stringify(input);
  const result = createAutoLayout(input);
  assert.equal(JSON.stringify(input), before);
  assert.notEqual(result.positions['1'].x, -100);
});
