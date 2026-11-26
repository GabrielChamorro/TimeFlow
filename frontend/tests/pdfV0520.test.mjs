import { test } from 'node:test';
import assert from 'node:assert/strict';
import { boundedPdfScale } from '../src/utils/pdfViewport.js';
test('el PDF limita las dimensiones y píxeles del canvas ante páginas enormes',()=>{
  for(const [w,h] of [[595,842],[100000,100000],[1e8,10]]) {
    const s=boundedPdfScale(w,h); assert.ok(w*s<=2400 && h*s<=2400); assert.ok(w*h*s*s<=8_000_000);
  }
});
test('dimensiones PDF inválidas se rechazan',()=>{
  for(const [w,h] of [[0,1],[-1,1],[Infinity,20],[5,NaN]]) assert.throws(()=>boundedPdfScale(w,h));
});
