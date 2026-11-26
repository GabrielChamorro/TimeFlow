import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const workday = readFileSync(new URL("../src/pages/WorkdayView.jsx", import.meta.url), "utf8");
const gallery = readFileSync(new URL("../src/components/EvidenceGallery.jsx", import.meta.url), "utf8");
const api = readFileSync(new URL("../../backend/src/main/java/com/teamflow/backend/controllers/EvidenciaTareaController.java", import.meta.url), "utf8");
const modal = readFileSync(new URL("../src/components/TaskModal.jsx", import.meta.url), "utf8");

test("Mi Jornada reutiliza la misma galería que Monitoreo Espacial", () => {
  assert.match(workday, /import EvidenceGallery from "\.\.\/components\/EvidenceGallery\.jsx"/);
  assert.match(workday, /<EvidenceGallery[\s\S]*?taskId=\{task\.id\}[\s\S]*?taskVersion=\{task\.version\}[\s\S]*?legacyEvidence=\{task\.evidencia\}/);
  assert.match(gallery, /\/evidencias/);
});

test("La lista de Jornada no carga evidencias hasta abrir la tarea", () => {
  assert.match(workday, /evidenceTaskOpen === String\(task\.id\) && \(/);
  assert.match(workday, /setEvidenceTaskOpen\(current => current === String\(task\.id\) \? null : String\(task\.id\)\)/);
});

test("La subida se permite solo si la tarea está En Progreso", () => {
  assert.match(workday, /canEdit=\{task\.estado === "En Progreso"\}/);
  assert.match(gallery, /\{canEdit && <div/);
});

test("Se conserva la subida de archivos en el formulario al crear una tarea", () => {
  assert.match(workday, /<EvidenceDropzone files=\{evidenceFiles\}/);
  assert.match(workday, /await onUploadEvidence\(guardada\.id, file\)/);
});

test("Backend solo autoriza subir evidencias en tareas activas En Progreso", () => {
  assert.match(api, /t\.isActivo\(\)[\s\S]*?"En Progreso"\.equalsIgnoreCase\(t\.getEstado\(\)\)/);
  assert.match(api, /if \(!puedeEditar\(u,t\)\) return ResponseEntity\.status\(403\)/);
  assert.match(api, /!"En Progreso"\.equalsIgnoreCase\(t\.getEstado\(\)\)/);
});

test("Los dos apartados bloquean subida al salir de En Progreso", () => {
  assert.match(modal, /const canEdit = \(isOwner \|\| isAdmin\) && visibleState === "En Progreso"/);
  assert.match(workday, /canEdit=\{task\.estado === "En Progreso"\}/);
  assert.match(gallery, /if\(!canEdit \|\| !files\.length \|\| busy\)return/);
});
