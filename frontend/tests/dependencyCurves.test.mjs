import test from 'node:test';
import assert from 'node:assert/strict';
import {buildDependencyCurve, createDependencyEdges, NODE_WIDTH, NODE_HEIGHT} from '../src/utils/mapLayout.js';

// Reproducción del fallo V0.5.8: abrir Monitoreo con un backend que devuelve
// dependencias reales obligaba a dibujar la curva y lanzaba ReferenceError:
// NODE_HEIGHT is not defined. La geometría ahora es una función probada.
const tasks = [
  {id: 1, x: 100, y: 80, dependenciaIds: []},
  {id: 2, x: 560, y: 190, dependenciaIds: [1]},
  {id: 3, x: 560, y: 460, dependenciaIds: [1, 2]},
];

test('con tareas reales, crea todas las curvas sin errores de variables', () => {
  const byId = new Map(tasks.map(task => [String(task.id), task]));
  const edges = createDependencyEdges(tasks).filter(edge => edge.explicit);
  assert.equal(edges.length, 3);
  for (const edge of edges) {
    const curve = buildDependencyCurve(byId.get(edge.parentId), byId.get(edge.taskId));
    assert.match(curve.d, /^M -?\d/);
    assert(!curve.d.includes('NaN'));
    assert(Number.isFinite(curve.endX));
    assert(Number.isFinite(curve.endY));
  }
});

test('la flecha nace en el borde de la dependencia y termina en el de la tarea', () => {
  const path = buildDependencyCurve(tasks[0], tasks[1]);
  assert.equal(path.p0.x, tasks[0].x + NODE_WIDTH);
  assert.equal(path.p0.y, tasks[0].y + NODE_HEIGHT / 2);
  assert.equal(path.endX, tasks[1].x);
  assert.equal(path.endY, tasks[1].y + NODE_HEIGHT / 2);
});

test('las dependencias situadas a la derecha también apuntan al destino', () => {
  const curve = buildDependencyCurve(tasks[1], tasks[0]);
  assert.equal(curve.p0.x, tasks[1].x);
  assert.equal(curve.endX, tasks[0].x + NODE_WIDTH);
  assert(!curve.d.includes('NaN'));
});
