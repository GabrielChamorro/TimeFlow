import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const backend = name => readFileSync(new URL(`../../backend/src/main/java/com/teamflow/backend/${name}`, import.meta.url), 'utf8');
const sql = readFileSync(new URL('../../backend/sql/esquema_timeflow.sql', import.meta.url), 'utf8');

test('la subida de evidencias tiene un limite mayor que el de JSON', () => {
  const filter = backend('security/RequestSizeLimitFilter.java');
  assert.match(filter, /MAX_REQUEST_BYTES = 4L/);
  assert.match(filter, /MAX_UPLOAD_REQUEST_BYTES = 61L/);
  assert.match(filter, /\/api\/tareas\/\[0-9\]\+\/evidencias/);
});

test('la lectura de archivos necesita comprobar permisos', () => {
  const controller = backend('controllers/EvidenciaTareaController.java');
  assert.match(controller, /TaskAccessRules\.puedeLeer/);
  assert.match(controller, /return ResponseEntity\.status\(403\)/);
});

test('las tareas nuevas se vinculan al identificador del responsable', () => {
  const controller = backend('controllers/TareaController.java');
  assert.match(controller, /setAsignadoUsuarioId/);
  assert.match(backend('security/TaskAccessRules.java'), /getAsignadoUsuarioId/);
  assert.match(sql, /ADD COLUMN asignado_usuario_id BIGINT NULL/);
});

test('las evidencias desactivadas tambien cuentan para el limite de almacenamiento', () => {
  const controller = backend('controllers/EvidenciaTareaController.java');
  assert.match(controller, /countByTareaId/);
  assert.match(controller, /bytesTotalesPorTarea/);
  assert.match(controller, /findByIdForUpdate/);
});

test('el JWT se vincula al ID del usuario, no solo al correo', () => {
  const jwt = backend('config/JwtService.java');
  assert.match(jwt, /claimId instanceof Number/);
  assert.match(jwt, /usuario\.getId\(\)/);
});
