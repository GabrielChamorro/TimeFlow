import test from 'node:test';
import assert from 'node:assert/strict';
import { ensureListPayload, sessionIsCurrent } from '../src/utils/sessionData.js';

test('rechaza respuestas mal formadas para no bloquear la interfaz', () => {
  assert.throws(() => ensureListPayload({ message: 'Error' }, 'tareas'), /formato inválido/);
  assert.deepEqual(ensureListPayload([{ id: 1 }, null, undefined, [], 'texto']), [{ id: 1 }]);
});

test('descarta respuestas de una sesión anterior', () => {
  assert.equal(sessionIsCurrent(3, 4), false);
  assert.equal(sessionIsCurrent(4, 4), true);
});
