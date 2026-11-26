import test from "node:test";
import assert from "node:assert/strict";
import { clockAnchor, taskElapsed, formatElapsed, validTaskSync, taskRefreshNeeded, newerJornada } from "../src/utils/taskClock.js";
test("Tres tiempos aislados y creación posterior no reinicia A", () => {
  const anchor = clockAnchor(100000, 0, 100);
  const clocks = [10000, 50000, 90000].map(tiempoInicioMs => ({ tiempoAcumuladoMs: 0, tiempoInicioMs }));
  assert.deepEqual(clocks.map(t => taskElapsed(t, anchor, 1100)), [91050, 51050, 11050]);
  assert.equal(taskElapsed(clocks[0], anchor, 2100), 92050);
});
test("Reloj de pared desfasado no interviene; dos clientes y F5 recalibran con RTT", t => {
  const task = { tiempoAcumuladoMs: 2000, tiempoInicioMs: 10000 };
  const a = clockAnchor(20000, 100, 200), b = clockAnchor(20000, 8100, 8200);
  assert.equal(taskElapsed(task, a, 1200), taskElapsed(task, b, 9200));
  t.mock.method(Date, "now", () => 9999999999999);
  const ahead = taskElapsed(task, a, 1200);
  t.mock.method(Date, "now", () => 1);
  assert.equal(taskElapsed(task, a, 1200), ahead);
  const reloaded = clockAnchor(21000, 0, 100);
  assert.equal(taskElapsed(task, a, 1200), taskElapsed(task, reloaded, 100));
});
test("Pausa, finalización y datos antiguos no acumulan ni inventan HH:mm", () => {
  assert.equal(taskElapsed({ tiempoAcumuladoMs: 3750, tiempoInicioMs: null }, null, 99999), 3750);
  assert.equal(taskElapsed({ fechaInicio: "08:00", tiempoAcumuladoMs: null }, null, 0), null);
  assert.equal(taskElapsed({ tiempoAcumuladoMs: 0, tiempoInicioMs: 1 }, null, 0), null);
  assert.equal(formatElapsed(90061000), "25:01:01");assert.equal(formatElapsed(null), "Tiempo no registrado");
});
test("Cambios de versión/IDs recargan; notas no descargan tareas completas; snapshot viejo no revierte", () => {
  const tasks=[{id:1,version:3}];
  assert.equal(taskRefreshNeeded(tasks,[{id:1,version:3,ultimoRegistroId:9}]),false);
  assert.equal(taskRefreshNeeded(tasks,[{id:1,version:4}]),true);
  assert.equal(taskRefreshNeeded(tasks,[{id:1,version:2}]),false);
  assert.equal(taskRefreshNeeded(tasks,[{id:2,version:3}]),true);
  assert.equal(taskRefreshNeeded(tasks,[]),true);
});
test("Jornada cruzada nunca reabre salida confirmada ni reemplaza una entrada más reciente", () => {
  const closed={id:2,activa:false};assert.equal(newerJornada(closed,{id:2,activa:true}),closed);
  assert.equal(newerJornada(closed,{id:1,activa:true}),closed);
  assert.deepEqual(newerJornada(closed,{id:3,activa:true}),{id:3,activa:true});
});
test("Validación de sincronización rechaza datos malformados y tiempo negativo", () => {
  assert.equal(validTaskSync({serverNowMs:100,tasks:[{id:1,version:0,estado:"En Progreso",tiempoAcumuladoMs:0,tiempoInicioMs:10}]}),true);
  assert.equal(validTaskSync({serverNowMs:100,tasks:[{id:1,version:0,estado:"En Progreso",tiempoAcumuladoMs:-1}]}),false);
  assert.equal(clockAnchor(100,20,10),null);
});
