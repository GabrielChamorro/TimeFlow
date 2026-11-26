import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createSprint5DemoTasks } from "../src/data/sprint5DemoTasks.js";

test("la demo contiene 100 tareas con identificadores únicos", () => {
  const tasks = createSprint5DemoTasks(100);
  assert.equal(tasks.length, 100);
  assert.equal(new Set(tasks.map((task) => task.id)).size, 100);
  assert.equal(new Set(tasks.map((task) => task.codigo)).size, 100);
  assert.equal(tasks[0].codigo, "DEMO-001");
  assert.equal(tasks.at(-1).codigo, "DEMO-100");
});

test("cada detalle ficticio tiene los datos que muestra el visor", () => {
  const tasks = createSprint5DemoTasks(100);
  for (const task of tasks) {
    for (const field of ["id", "codigo", "nombre", "descripcion", "meta", "bitacora", "estado", "asignadoA", "fecha", "fechaLimite", "metaCumplida"]) {
      assert.ok(Object.hasOwn(task, field), `Falta ${field} para ${task.codigo}`);
      assert.notEqual(task[field], null);
    }
    assert.equal(task.posicionX, null);
    assert.equal(task.posicionY, null);
  }
});

test("el detalle ficticio está separado de las funciones de escritura", () => {
  // Resguardo estático adicional. El comportamiento del clic requiere validación en navegador.
  const source = readFileSync(new URL("../src/components/DemoTaskModal.jsx", import.meta.url), "utf8");
  assert.match(source, /role="dialog"/);
  assert.match(source, /Solo lectura/);
  assert.doesNotMatch(source, /\bapiFetch\b|\bfetch\s*\(|\blocalStorage\b|onUpdateTask|onDeleteTask|onApproveTask|onRejectTask/);
});

test("los clics en los nodos de demostración abren su propio detalle", () => {
  // Evita volver al onSelectTask vacío de V0.5.1. El clic real se prueba en navegador.
  const source = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
  assert.match(source, /onSelectTask=\{demoSprint5 \? setSelectedDemoTask : handleSelectTaskOnMap\}/);
  assert.match(source, /onMoveTask=\{demoSprint5 \? undefined : handleMoveTask\}/);
  assert.match(source, /<DemoTaskModal\s+task=\{selectedDemoTask\}/);
});
