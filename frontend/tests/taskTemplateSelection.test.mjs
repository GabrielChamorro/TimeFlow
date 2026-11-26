import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { findTaskTemplate, getValidTaskTemplateId } from "../src/utils/taskTemplateSelection.js";

const templates = [
  { id: 1, nombre: "Diseño UI/UX en Figma", descripcion: "Diseño" },
  { id: 2, nombre: "Pruebas de API", descripcion: "Pruebas" },
  { id: 3, nombre: "Revisión de SQL", descripcion: "SQL" },
];

test("cambia a cualquier plantilla cuyo ID en MySQL sea numérico", () => {
  assert.equal(getValidTaskTemplateId(templates, "2"), "2");
  assert.equal(findTaskTemplate(templates, "2").nombre, "Pruebas de API");
  assert.equal(getValidTaskTemplateId(templates, "3"), "3");
  assert.equal(findTaskTemplate(templates, "3").descripcion, "SQL");
});

test("mantiene la plantilla aunque se recargue la lista desde el backend", () => {
  const refreshed = templates.map((item) => ({ ...item }));
  assert.equal(getValidTaskTemplateId(refreshed, "3"), "3");
});

test("selecciona la primera solo al iniciar o si se eliminó la elegida", () => {
  assert.equal(getValidTaskTemplateId(templates, ""), "1");
  assert.equal(getValidTaskTemplateId(templates.slice(1), "1"), "2");
});

test("no inventa una plantilla si el catálogo está vacío", () => {
  assert.equal(getValidTaskTemplateId([], "1"), "");
  assert.equal(findTaskTemplate([], "1"), null);
});

test("admite IDs numéricos o alfanuméricos sin mezclar otros valores", () => {
  assert.equal(getValidTaskTemplateId(templates, 2), "2");
  assert.equal(findTaskTemplate(templates, "99"), null);
  assert.equal(getValidTaskTemplateId([{ id: "tipo-a" }, { id: "tipo-b" }], "tipo-b"), "tipo-b");
});

test("la pantalla usa la validación normalizada al seleccionar y crear", () => {
  const jsx = readFileSync(new URL("../src/pages/WorkdayView.jsx", import.meta.url), "utf8");
  assert.match(jsx, /findTaskTemplate\(tareasPreestablecidas, e\.target\.value\)/);
  assert.match(jsx, /findTaskTemplate\(tareasPreestablecidas, selectedPreId\)/);
  assert.match(jsx, /value=\{String\(t\.id\)\}/);
  assert.doesNotMatch(jsx, /t\.id === selectedPreId/);
});
