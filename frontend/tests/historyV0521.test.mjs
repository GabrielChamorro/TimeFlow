import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = p => readFileSync(new URL('../src/'+p,import.meta.url),'utf8');
test('el historial solicita páginas y carga detalles solo al abrir',()=>{
  const s=read('pages/HistoryView.jsx');assert.match(s,/\/historial\?\$\{params\}/);
  assert.match(s,/page: String\(page\), size: String\(size\)/);assert.match(s,/TAREAS\}\/\$\{id\}/);
  assert.doesNotMatch(s,/\.filter\(/);assert.match(s,/setPage\(0\)/);assert.match(s,/Fecha no registrada/);
  assert.match(s,/epoch === getSessionEpoch\(\)/);
});
test('el historial está disponible para ambos roles sin descargar el mapa al actualizarlo',()=>{
  const s=read('App.jsx');assert.match(s,/activeTab === "historial".*setHistoryRefresh/);
  assert.match(s,/activeTab === "historial" && <HistoryView/);
});
