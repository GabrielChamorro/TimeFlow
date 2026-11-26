import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validPresence, presenceValue, presenceText } from '../src/utils/presence.js';
test('presencia válida usa booleanos de jornada, no cadenas de estado de cuenta',()=>{
  assert.equal(validPresence({serverNowMs:100,members:[{id:1,nombre:'Uno',rol:'trabajador',presente:true}]}),true);
  assert.equal(validPresence({serverNowMs:100,members:[{id:1,nombre:'Uno',rol:'trabajador',presente:'activo'}]}),false);
  assert.equal(validPresence({members:[]}),false);
});
test('dos trabajadores pueden tener presencias distintas y una baja desaparece sin verde residual',()=>{
  const snapshot={available:true,members:[{id:1,presente:true},{id:2,presente:false}]};
  assert.equal(presenceValue(snapshot,1),true);assert.equal(presenceValue(snapshot,'2'),false);
  assert.equal(presenceValue(snapshot,3),false);assert.equal(presenceValue(snapshot,null),null);
});
test('fallos de red y datos no cargados no se presentan como jornada cerrada',()=>{
  assert.equal(presenceValue({available:false,members:[{id:1,presente:true}]},1),null);
  assert.equal(presenceValue(null,1),null);assert.equal(presenceText(true),'En jornada');
  assert.equal(presenceText(false),'Fuera de jornada');assert.match(presenceText(null),/sin datos/);
});
