import test from 'node:test';
import assert from 'node:assert/strict';
import { MAX_EVIDENCE_BYTES, evidenceAllowed } from '../src/components/evidenceLimits.mjs';

test('el límite de archivos es 60 MB exactos', () => {
  assert.equal(MAX_EVIDENCE_BYTES, 60*1024*1024);
  assert.equal(evidenceAllowed({name:'video.mp4',size:MAX_EVIDENCE_BYTES}),true);
  assert.equal(evidenceAllowed({name:'video.mp4',size:MAX_EVIDENCE_BYTES+1}),false);
});
test('el selector mantiene los tipos autorizados y rechaza archivos vacíos', () => {
  for (const name of ['a.pdf','b.docx','c.webm','d.txt','e.png']) {
    assert.equal(evidenceAllowed({name,size:1024}),true);
  }
  assert.equal(evidenceAllowed({name:'malware.exe',size:200}),false);
  assert.equal(evidenceAllowed({name:'vacio.mp4',size:0}),false);
});
