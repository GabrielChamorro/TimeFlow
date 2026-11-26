import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const deps = JSON.parse(read('../package.json'));
const lock = JSON.parse(read('../package-lock.json'));

test('Vite incluye la corrección del aviso crítico de noviembre de 2026', () => {
  assert.equal(deps.devDependencies.vite, '8.2.6');
  assert.equal(lock.packages[''].devDependencies.vite, '8.2.6');
  assert.equal(lock.packages['node_modules/vite'].version, '8.2.6');
  assert.match(read('../vite.config.js'), /host:\s*'127\.0\.0\.1'/);
});

test('la vista previa de PDFs no habilita ejecución de scripts', () => {
  const source = read('../src/components/EvidenceGallery.jsx');
  assert.match(source, /<PdfPreview/);
  const preview=read('../src/components/PdfPreview.jsx');
  assert.match(preview, /<canvas/);
  assert.match(preview, /isEvalSupported: false/);
  assert.doesNotMatch(preview, /PDFScriptingManager|dangerouslySetInnerHTML|<iframe/);
  assert.doesNotMatch(source, /sandbox="allow-scripts"/);
});

test('limita también intentos masivos por IP y contrasta credenciales ficticias', () => {
  const limiter = read('../../backend/src/main/java/com/teamflow/backend/security/LoginAttemptLimiter.java');
  const auth = read('../../backend/src/main/java/com/teamflow/backend/controllers/AuthController.java');
  assert.match(limiter, /MAX_FAILURES_PER_IP = 30/);
  assert.match(limiter, /incrementar\(ipEntries, ipKey\(ip\)/);
  assert.match(auth, /passwordEncoder\.matches\(password, dummyPasswordHash\)/);
});

test('revisa contenido DOCX, nombres ZIP y tamaño descomprimido', () => {
  const source = read('../../backend/src/main/java/com/teamflow/backend/security/EvidenciaArchivoRules.java');
  assert.match(source, /maxDescomprimidos = 128L \* 1024 \* 1024/);
  assert.match(source, /\[Content_Types\]\.xml/);
  assert.match(source, /word\/document\.xml/);
});
