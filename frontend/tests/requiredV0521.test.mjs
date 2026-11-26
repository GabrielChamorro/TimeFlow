import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const source=readFileSync(new URL('../src/pages/WorkdayView.jsx',import.meta.url),'utf8');
test('nombre, meta y fecha límite se toman del formulario sin valores de sustitución',()=>{
  assert.match(source,/!taskName \|\| !taskMeta \|\| !taskDeadline/);
  assert.match(source,/fechaLimite: taskDeadline/);assert.match(source,/meta: taskMeta/);
  assert.match(source,/name="meta"\s+required/);assert.match(source,/name="deadline"\s+required/);
});
