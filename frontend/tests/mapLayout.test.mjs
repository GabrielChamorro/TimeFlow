import test from "node:test";
import assert from "node:assert/strict";
import { createDefaultPositions, fitNodes, isNodeVisible, isEdgeVisible } from "../src/utils/mapLayout.js";

const makeTasks = (count) => Array.from({ length: count }, (_, i) => ({ id: i + 1 }));

test("100 tareas generan posiciones únicas y compactas", () => {
  const positions = createDefaultPositions(makeTasks(100));
  assert.equal(Object.keys(positions).length, 100);
  assert.equal(new Set(Object.values(positions).map((p) => `${p.x}:${p.y}`)).size, 100);
  assert.ok(Math.max(...Object.values(positions).map((p) => p.x)) <= 2300);
  // Una tarjeta con etiquetas puede superar 150 px: priorizamos no superponer nodos.
  assert.ok(Math.max(...Object.values(positions).map((p) => p.y)) <= 2400);
});

test("agregar nueva tarea no desplaza las existentes", () => {
  const before = createDefaultPositions(makeTasks(100));
  const after = createDefaultPositions([{ id: 101 }, ...makeTasks(100)]);
  for (let i = 1; i <= 100; i++) assert.deepEqual(before[String(i)], after[String(i)]);
});

test("mapa virtualizado muestra nodos cercanos, no los alejados", () => {
  const tasks = makeTasks(100).map((t) => ({ ...t, ...createDefaultPositions(makeTasks(100))[t.id] }));
  const visible = tasks.filter((t) => isNodeVisible(t, { x: 0, y: 0 }, 1, { width: 950, height: 620 }));
  assert.ok(visible.length > 0 && visible.length < 100);
  assert.ok(visible.some((t) => t.id === 1));
  assert.ok(!visible.some((t) => t.id === 100));
});

test("un segmento que cruza la pantalla no desaparece", () => {
  assert.equal(isEdgeVisible({x:-500,y:100}, {x:500,y:100}, {x:0,y:0}, 1, {width:600,height:400}), true);
  assert.equal(isEdgeVisible({x:-500,y:-500}, {x:-400,y:-400}, {x:0,y:0}, 1, {width:600,height:400}), false);
});

test("encajar nodos produce zoom y desplazamiento finitos", () => {
  const positions = createDefaultPositions(makeTasks(100));
  const nodes = makeTasks(100).map((t) => ({ ...t, ...positions[t.id] }));
  const view = fitNodes(nodes, { width: 1200, height: 640 });
  assert.ok(view.zoom >= 0.15 && view.zoom <= 2.5);
  assert.ok(Number.isFinite(view.pan.x) && Number.isFinite(view.pan.y));
});

test("sin nodos se conserva la vista inicial", () => {
  assert.deepEqual(fitNodes([], { width: 1200, height: 640 }), { zoom: 0.85, pan: { x: 0, y: 0 } });
});
