import test from "node:test";
import assert from "node:assert/strict";
import { reuseUnchangedTasks, completedTaskSignature } from "../src/utils/taskSyncState.js";
test("Una edición remota de cien conserva las otras 99 tarjetas", () => {
  const previous=Array.from({length:100},(_,i)=>({id:i+1,version:0,nombre:`Tarea ${i}`,dependenciaIds:i?[i]:[],ultimoRegistroId:17}));
  const incoming=previous.map(t=>({...t,dependenciaIds:[...t.dependenciaIds],ultimoRegistroId:null}));incoming[49]={...incoming[49],version:1,nombre:"Editada"};
  const next=reuseUnchangedTasks(previous,incoming);
  assert.equal(next.filter((t,i)=>t===previous[i]).length,99);assert.equal(next[49],incoming[49]);assert.equal(next[0].ultimoRegistroId,17);
});
test("Lectura sin cambios conserva el listado; altas, bajas y orden remotos siguen vigentes", () => {
  const old=[{id:1,version:0,nombre:"A"},{id:2,version:0,nombre:"B"}];
  assert.equal(reuseUnchangedTasks(old,old.map(t=>({...t}))),old);
  assert.deepEqual(reuseUnchangedTasks(old,[{...old[1]}]),[old[1]]);
  assert.deepEqual(reuseUnchangedTasks(old,[{...old[1]},{...old[0]},{id:3,version:0,nombre:"C"}]).map(t=>t.id),[2,1,3]);
});
test("Una respuesta sin datos privados no conserva contenido previamente visible", () => {
  const old=[{id:1,version:0,bitacora:"Privado",evidencia:"Privado",dependenciaIds:[2]}];
  const redacted={id:1,version:0,bitacora:null,evidencia:null,dependenciaIds:[2]};
  assert.equal(reuseUnchangedTasks(old,[redacted])[0],redacted);
  assert.notEqual(reuseUnchangedTasks(old,[{...old[0],dependenciaIds:[3]}])[0],old[0]);
});
test("Historial se invalida con finalizaciones remotas; posiciones y orden no lo invalidan", () => {
  const before=[{id:1,estado:"En Revisión"},{id:2,estado:"Finalizada",version:1}];
  assert.equal(completedTaskSignature(before),completedTaskSignature([...before].reverse().map(t=>({...t,version:4,posicionX:500}))));
  assert.notEqual(completedTaskSignature(before),completedTaskSignature(before.map(t=>({...t,estado:"Finalizada"}))));
});
