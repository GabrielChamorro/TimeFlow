import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const s=readFileSync(new URL('../src/pages/WorkdayView.jsx',import.meta.url),'utf8');
test('la salida con tareas activas requiere confirmación explícita y permite cancelar',()=>{
  assert.match(s,/activeTaskCount\) setCheckoutConfirm\(true\)/);assert.match(s,/role="alertdialog"/);
  assert.match(s,/Cancelar salida/);assert.match(s,/Confirmar Check-out/);
  assert.match(s,/duracionSegundos/);assert.match(s,/durationLabel\(jornada.duracionSegundos\)/);
});
