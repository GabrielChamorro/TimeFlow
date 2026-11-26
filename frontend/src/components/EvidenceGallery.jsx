import { createPortal } from "react-dom";
import ConfirmAction from "./ConfirmAction.jsx";
import React, { useEffect, useMemo, useState, lazy, Suspense } from "react";
import EvidenceDropzone from "./EvidenceDropzone.jsx";
import { bytesLabel } from "./evidenceLimits.mjs";
import PreviewBoundary from "./PreviewBoundary.jsx";
import { ENDPOINTS, apiFetch } from "../config/api_interaccion_backend.js";

const PdfPreview=lazy(()=>import("./PdfPreview.jsx"));

const category=mime => mime?.startsWith("image/") ? "Imagen" : mime?.startsWith("video/") ? "Video" : mime === "application/pdf" ? "PDF" : "Documento";
const icon=mime => mime?.startsWith("image/") ? "🖼️" : mime?.startsWith("video/") ? "🎬" : mime === "application/pdf" ? "📕" : "📄";

export default function EvidenceGallery({ taskId, legacyEvidence, canEdit=false, taskVersion }) {
  const [items,setItems]=useState([]);
  const [files,setFiles]=useState([]);
  const [active,setActive]=useState(null);
  const [url,setUrl]=useState(null);
  const [loading,setLoading]=useState(false);
  const [busy,setBusy]=useState(false);
  const [pendingRemoval,setPendingRemoval]=useState(null);
  const [error,setError]=useState("");
  const [zoom,setZoom]=useState(1);
  const [lightbox,setLightbox]=useState(false);
  const base=`${ENDPOINTS.TAREAS}/${taskId}/evidencias`;
  const refresh=async()=>{
    const res=await apiFetch(base);
    if(!res.ok) throw new Error("No se pudieron consultar los archivos de esta tarea.");
    const data=await res.json(); if(!Array.isArray(data)) throw new Error("Lista de archivos inválida"); setItems(data);
  };
  useEffect(()=>{
    let cancelled=false;
    apiFetch(base).then(async res=>{
      if(!res.ok) throw new Error("No se pudieron cargar los archivos.");
      const data=await res.json();if(!Array.isArray(data))throw new Error("Lista de archivos inválida");if(!cancelled)setItems(data);
    }).catch(err=>{if(!cancelled)setError(err.message);});
    setActive(null);setUrl(null);setLightbox(false);
    return ()=>{cancelled=true;};
  },[base]);
  useEffect(()=>{
    let cancelled=false, objectUrl=null;
    setZoom(1);setUrl(null);
    if(!active || active.legacy) return;
    setLoading(true);
    apiFetch(`${base}/${active.id}`).then(async res=>{
      if(!res.ok)throw new Error("No se pudo abrir el archivo.");
      objectUrl=URL.createObjectURL(await res.blob());
      if(!cancelled) setUrl(objectUrl);
      else URL.revokeObjectURL(objectUrl);
    }).catch(err=>{if(!cancelled)setError(err.message);}).finally(()=>{if(!cancelled)setLoading(false);});
    return ()=>{cancelled=true;if(objectUrl)URL.revokeObjectURL(objectUrl);};
  },[base,active]);
  useEffect(()=>{const handler=e=>{if(e.key==="Escape")setLightbox(false);};document.addEventListener("keydown",handler);return()=>document.removeEventListener("keydown",handler);},[]);
  const all=useMemo(()=>[
    ...(legacyEvidence ? [{id:"legacy",nombreOriginal:"Imagen anterior",tipoMime:"image/legacy",legacy:true,src:legacyEvidence}] : []),...items
  ],[legacyEvidence,items]);
  const chosen=active && all.find(i=>i.id===active.id);
  const source=chosen?.legacy ? chosen.src : url;
  const upload=async()=>{
    if(!canEdit || !files.length || busy)return;
    setBusy(true);setError("");
    try{
      for(const file of files){
        const body=new FormData();body.append("archivo",file);
        const res=await apiFetch(base,{method:"POST",body});
        if(!res.ok){const data=await res.json().catch(()=>({}));throw new Error(`No se pudo subir ${file.name}: ${data.message||res.status}`);}
      }
      setFiles([]);await refresh();
    }catch(err){setError(err.message);}finally{setBusy(false);}
  };
  const remove=async()=>{
    if(!pendingRemoval || busy || !canEdit)return;
    setBusy(true);setError("");
    try{const res=await apiFetch(`${base}/${pendingRemoval.id}?version=${encodeURIComponent(pendingRemoval.version)}`,{method:"DELETE"});if(!res.ok){const data=await res.json().catch(()=>({}));throw new Error(data.message||"No se pudo desactivar el archivo.");}setActive(null);setPendingRemoval(null);await refresh();}
    catch(err){setError(err.message);}finally{setBusy(false);}
  };
  return <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3" aria-label="Evidencias de la tarea">
    <div className="flex items-center justify-between gap-2"><h4 className="text-sm font-bold text-slate-900">Evidencias de la tarea</h4><span className="text-xs bg-white rounded-full border border-slate-200 px-2 py-1">{all.length} archivo(s)</span></div>
    {canEdit && <div className="space-y-2"><EvidenceDropzone files={files} onChange={setFiles} compact disabled={busy}/>
      <button type="button" onClick={upload} disabled={!files.length || busy} className="bg-indigo-600 text-white text-xs font-semibold px-4 py-2 rounded-lg disabled:opacity-40">{busy?"Subiendo...":`Subir ${files.length||""} archivo(s)`}</button>
    </div>}
    {all.length===0 && <p className="text-xs text-slate-500">Esta tarea todavía no tiene archivos adjuntos.</p>}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{all.map(item=><button type="button" key={item.id} onClick={()=>{setActive(item);setError("");}}
      className={`rounded-xl text-left border px-3 py-2 flex gap-2 items-center ${chosen?.id===item.id?"bg-indigo-50 border-indigo-400":"bg-white border-slate-200 hover:border-indigo-300"}`}>
      <span className="text-lg" aria-hidden="true">{icon(item.tipoMime)}</span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold text-slate-800">{item.nombreOriginal}</span><span className="text-[11px] text-slate-500">{category(item.tipoMime)}{item.tamanoBytes?` · ${bytesLabel(item.tamanoBytes)}`:""}</span></span>
    </button>)}</div>
    {chosen && <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-3">
      <div className="flex justify-between items-center gap-2"><span className="text-xs font-bold text-slate-800 truncate">{chosen.nombreOriginal}</span>
      <div className="flex gap-2"><button type="button" onClick={()=>{setActive(null);setLightbox(false);}} className="text-xs text-slate-600 hover:underline">Cerrar</button>
      {canEdit&&!chosen.legacy&&<button type="button" disabled={busy} onClick={()=>{setError("");setPendingRemoval({...chosen,version:taskVersion});}} className="text-xs text-rose-600 hover:underline">Desactivar</button>}</div></div>
      {loading && <p className="text-xs text-slate-500">Abriendo archivo...</p>}
      {source && chosen.tipoMime.startsWith("image/") && <><button type="button" className="block w-full" onClick={()=>setLightbox(true)} title="Abrir imagen en grande"><img src={source} alt={chosen.nombreOriginal} className="max-h-72 w-full object-contain rounded-lg bg-slate-100"/></button>
        <button type="button" onClick={()=>setLightbox(true)} className="text-xs text-indigo-700 font-semibold">Ver imagen en grande</button></>}
      {source && chosen.tipoMime.startsWith("video/") && <video src={source} controls preload="metadata" playsInline className="w-full max-h-80 rounded-lg bg-black">Tu navegador no permite reproducir este video.</video>}
      {source && chosen.tipoMime==="application/pdf" && <PreviewBoundary key={`${taskId}:${chosen.id}`}><Suspense fallback={<p role="status">Cargando visor PDF…</p>}><PdfPreview source={source} name={chosen.nombreOriginal}/></Suspense></PreviewBoundary>}
      {source && <a href={source} download={chosen.nombreOriginal} className="inline-block text-xs text-indigo-700 font-semibold underline">Descargar archivo</a>}
      {source && !chosen.tipoMime.startsWith("video/")&&!chosen.tipoMime.startsWith("image/")&&chosen.tipoMime!=="application/pdf" && <p className="text-xs text-slate-500">Este documento se puede descargar para abrirlo en su aplicación correspondiente.</p>}
    </div>}
    {error && <p role="alert" className="text-xs text-rose-700">{error}</p>}
    {lightbox && source && chosen?.tipoMime.startsWith("image/") && createPortal(<div role="dialog" aria-modal="true" aria-label="Vista ampliada de imagen" className="tf-ui-panel-enter fixed inset-0 z-[80] bg-slate-950/95 p-5 flex flex-col gap-3 items-center justify-center">
      <div className="flex gap-2 items-center text-white"><button type="button" onClick={()=>setZoom(v=>Math.max(0.5,v-0.25))} className="px-3 py-2 bg-slate-800 rounded-lg">−</button><span className="text-xs">{Math.round(zoom*100)}%</span><button type="button" onClick={()=>setZoom(v=>Math.min(3,v+0.25))} className="px-3 py-2 bg-slate-800 rounded-lg">+</button><button type="button" onClick={()=>setLightbox(false)} className="px-3 py-2 bg-rose-600 rounded-lg">Cerrar</button></div>
      <div className="w-full flex-1 min-h-0 overflow-auto flex items-center justify-center"><img src={source} alt={chosen.nombreOriginal} style={{transform:`scale(${zoom})`}} className="max-w-full max-h-full object-contain"/></div>
    </div>, document.body)}
    {pendingRemoval && <ConfirmAction title="Confirmar desactivación del archivo" confirmLabel="Sí, desactivar archivo" pending={busy} error={error} onCancel={()=>{setPendingRemoval(null);setError("");}} onConfirm={remove}>
      <p>Vas a desactivar <strong>{pendingRemoval.nombreOriginal}</strong>. No aparecerá en la tarea, pero permanecerá guardado en MySQL.</p>
    </ConfirmAction>}
  </section>;
}
