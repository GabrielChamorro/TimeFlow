import test from 'node:test';
import assert from 'node:assert/strict';
import { createDefaultPositions, NODE_WIDTH } from '../src/utils/mapLayout.js';

test('la distribución inicial respeta cadenas de más de 50 niveles', () => {
  const tasks = Array.from({ length: 100 }, (_, i) => ({ id: i + 1, dependenciaIds: i ? [i] : [] }));
  const positions = createDefaultPositions(tasks);
  for (let i = 2; i <= 100; i++) assert.ok(positions[i].x > positions[i - 1].x + NODE_WIDTH);
});

test('una cadena inversa de 12000 nodos no desborda la pila al abrir el mapa', () => {
  const tasks = Array.from({ length: 12000 }, (_, i) => ({ id: i + 1, dependenciaIds: i < 11999 ? [i + 2] : [] }));
  const positions = createDefaultPositions(tasks);
  assert.equal(Object.keys(positions).length, 12000);
  assert.ok(positions[1].x > positions[2].x);
});
