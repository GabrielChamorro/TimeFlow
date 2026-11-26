import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = p => readFileSync(new URL('../src/'+p,import.meta.url),'utf8');
test('las notas se agregan con autor/fecha del servidor y no sustituyen toda la bitácora',()=>{
  const s=read('components/TaskRecords.jsx');assert.match(s,/JSON.stringify\(\{ contenido: draft \}\)/);
  assert.match(s,/item.autorNombre/);assert.match(s,/item.creadoEnMs/);assert.doesNotMatch(s,/dangerouslySetInnerHTML/);
  assert.match(s,/page=\$\{page\}&size=20/);assert.match(s,/Registros siguientes/);
});
test('los formularios preservan texto antiguo y permiten agregar solo en progreso',()=>{
  const inline=read('components/TaskInlineEditor.jsx'), modal=read('components/TaskModal.jsx');
  assert.match(inline,/readOnly/);assert.match(inline,/canAdd=\{!locked\}/);
  assert.match(modal,/TaskRecords taskId=\{task.id\} canAdd=\{canEdit\}/);
  assert.match(modal,/value=\{task.bitacora \|\| ""\}/);
  assert.match(inline,/bitacora: recent.bitacora \|\| ""/);
});
