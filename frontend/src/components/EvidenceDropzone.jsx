import React, { useRef, useState } from "react";

import { evidenceAllowed, bytesLabel } from "./evidenceLimits.mjs";

export default function EvidenceDropzone({ files = [], onChange, disabled = false, compact = false }) {
  const inputRef=useRef(null);
  const [dragging,setDragging]=useState(false);
  const [error,setError]=useState("");
  const add = newFiles => {
    setError("");
    const incoming=Array.from(newFiles || []);
    const invalid=incoming.filter(f => !evidenceAllowed(f));
    if (invalid.length) setError("Archivo no permitido o superior a 60 MB. Se aceptan imágenes, PDF, Word, TXT y videos MP4/WEBM.");
    const valid=incoming.filter(evidenceAllowed);
    const remaining=Math.max(0,5-files.length);
    if (valid.length > remaining) setError("Puedes adjuntar hasta 5 archivos a la vez.");
    onChange([...files,...valid.slice(0,remaining)]);
  };
  return <div className="space-y-2">
    <div onDragOver={e=>{e.preventDefault(); if(!disabled)setDragging(true);}}
      onDragLeave={()=>setDragging(false)}
      onDrop={e=>{e.preventDefault();setDragging(false);if(!disabled)add(e.dataTransfer.files);}}
      className={`rounded-2xl border-2 border-dashed transition-colors ${dragging?"border-indigo-500 bg-indigo-100":"border-indigo-200 bg-indigo-50/60"} ${disabled?"opacity-50":""} ${compact?"p-3":"p-5"}`}>
      <input ref={inputRef} type="file" multiple disabled={disabled} className="hidden"
        accept=".png,.jpg,.jpeg,.gif,.webp,.pdf,.docx,.txt,.mp4,.webm"
        onChange={e=>{add(e.target.files);e.target.value="";}} />
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="rounded-xl bg-white border border-indigo-100 px-3 py-2 text-xl">📎</span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-800 text-xs">Archivos de evidencia</p>
          <p className="text-[11px] text-slate-500">Imágenes, PDF, DOCX, TXT y videos MP4 o WEBM. Máximo 60 MB por archivo.</p>
        </div>
        <button type="button" disabled={disabled} onClick={()=>inputRef.current?.click()}
          className="rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-3 py-2 text-xs font-semibold">Elegir archivos</button>
      </div>
      <p className="mt-2 text-[11px] text-slate-500">También puedes arrastrarlos aquí. Hasta 5 por selección.</p>
    </div>
    {files.length>0 && <div className="space-y-1">{files.map((file,index)=><div key={`${file.name}-${index}`} className="flex justify-between items-center rounded-lg bg-white border border-slate-200 p-2 gap-2 text-xs">
      <span className="truncate text-slate-700" title={file.name}>{file.name} <span className="text-slate-400">({bytesLabel(file.size)})</span></span>
      <button type="button" disabled={disabled} onClick={()=>onChange(files.filter((_,i)=>i!==index))} className="text-rose-600 hover:underline">Quitar</button>
    </div>)}</div>}
    {error && <p role="alert" className="text-xs text-rose-600">{error}</p>}
  </div>;
}
