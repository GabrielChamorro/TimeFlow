import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { canSubmitDeactivation, matchesDeactivationTarget } from '../src/utils/deactivationConfirm.js';

const source = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('cuentas: no se ejecuta hasta completar tres confirmaciones y escribir el correo correcto', () => {
  const base = { kind: 'account', typed: 'usuario@example.com', target: 'Usuario@example.com' };
  assert.equal(canSubmitDeactivation({ ...base, step: 1 }), false);
  assert.equal(canSubmitDeactivation({ ...base, step: 2 }), false);
  assert.equal(canSubmitDeactivation({ ...base, step: 3 }), true);
  assert.equal(canSubmitDeactivation({ ...base, step: 3, typed: 'otro@example.com' }), false);
  assert.equal(canSubmitDeactivation({ ...base, step: 3, typed: '' }), false);
});

test('plantillas: el nombre debe coincidir en la segunda confirmación', () => {
  const base = { kind: 'taskType', typed: 'Auditoría de red', target: 'Auditoría de red' };
  assert.equal(canSubmitDeactivation({ ...base, step: 1 }), false);
  assert.equal(canSubmitDeactivation({ ...base, step: 2 }), true);
  assert.equal(canSubmitDeactivation({ ...base, step: 2, typed: 'Otro tipo' }), false);
  assert.equal(matchesDeactivationTarget('  AUDITORÍA DE RED  ', 'Auditoría de red'), true);
  assert.equal(matchesDeactivationTarget(null, 'Auditoría de red'), false);
});

test('ambas pantallas usan la misma protección y evitan la desactivación directa al editar', () => {
  const userView = source('../src/pages/Usuarios.jsx');
  const typeView = source('../src/pages/TaskTypesView.jsx');
  const dialog = source('../src/components/ConfirmDeactivation.jsx');
  assert.match(userView, /import ConfirmDeactivation from/);
  assert.match(typeView, /import ConfirmDeactivation from/);
  assert.match(userView, /kind="account"/);
  assert.match(typeView, /kind="taskType"/);
  assert.match(userView, /disabled=\{Boolean\(pending\) \|\| Boolean\(editing\)\}><option value="activo"/);
  assert.match(dialog, /canSubmitDeactivation\(\{ kind, step, typed, target \}\)/);
  assert.match(dialog, /requestInFlight\.current/);
  assert.doesNotMatch(userView, /onClick=\{deactivate\}/);
  assert.doesNotMatch(typeView, /onClick=\{deactivate\}/);
});
