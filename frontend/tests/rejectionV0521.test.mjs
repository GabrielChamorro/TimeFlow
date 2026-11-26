import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = p => readFileSync(new URL('../src/'+p,import.meta.url),'utf8');
test('rechazar requiere motivo y utiliza la versión mostrada en el modal',()=>{
  const s=read('components/TaskModal.jsx');assert.match(s,/!motivoRechazo.trim\(\)/);
  assert.match(s,/accion\(task.id, reason, task.version, task\)/);assert.match(s,/kind="RECHAZO"/);
  assert.match(read('App.jsx'),/version: version \?\? tarea.version, estado: "En Progreso", motivoRechazo/);
});
