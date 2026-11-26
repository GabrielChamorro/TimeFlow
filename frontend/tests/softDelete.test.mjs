import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const load = name => readFileSync(new URL(`../../backend/src/main/java/com/teamflow/backend/${name}`, import.meta.url), 'utf8');

test('los endpoints de borrado no eliminan filas de MySQL', () => {
  for (const path of ['controllers/TareaController.java','controllers/UsuarioController.java',
    'controllers/TipoTareaController.java','controllers/EvidenciaTareaController.java',
    'controllers/MensajeController.java']) {
    const content=load(path);
    assert.match(content, /setActivo\(false\)|setEstado\("inactivo"\)/,path);
    assert.doesNotMatch(content, /\.deleteById\(|\.delete\(/,path);
  }
});

test('las tareas y plantillas se listan solo si estan activas', () => {
  assert.match(load('controllers/TareaController.java'), /findByActivoTrue\(\)/);
  assert.match(load('controllers/TipoTareaController.java'), /findByActivoTrue\(\)/);
});

test('el backend oculta usuarios, mensajes y archivos desactivados', () => {
  assert.match(load('controllers/UsuarioController.java'),/findVisibles\(\)/);
  assert.match(load('repositories/MensajeRepository.java'), /m\.activo = true AND \(/);
  assert.match(load('repositories/EvidenciaTareaRepository.java'), /e\.activo=true/);
  assert.match(load('controllers/EvidenciaTareaController.java'),/!e\.isActivo\(\)/);
});

test('el frontend no anuncia borrado permanente',()=>{
  for (const path of ['pages/TaskTypesView.jsx','pages/Usuarios.jsx','components/TaskModal.jsx','components/EvidenceGallery.jsx']) {
    const content = readFileSync(new URL(`../src/${path}`, import.meta.url),'utf8');
    assert.doesNotMatch(content,/eliminaci[oó]n ser[aá] permanente|eliminar[aá] su nodo|Sí, eliminar/);
    assert.match(content,/Desactivar|desactivar/);
  }
});

test('existe una migracion que conserva filas y agrega un estado',()=>{
  const content=readFileSync(new URL('../../backend/sql/migracion_v0.5.5_desactivacion.sql',import.meta.url),'utf8');
  assert.equal((content.match(/ADD COLUMN activo TINYINT\(1\) NOT NULL DEFAULT 1/g)||[]).length,4);
  assert.doesNotMatch(content,/\b(DROP TABLE|DELETE FROM|TRUNCATE)\b/i);
});
