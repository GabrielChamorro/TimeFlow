import React, { useEffect, useState } from "react";
import { ENDPOINTS, apiFetch } from "../config/api_interaccion_backend.js";
import TaskRecords from "./TaskRecords.jsx";

export default function TaskInlineEditor({ task, onUpdateTask }) {
  const [base, setBase] = useState(task);
  const [draft, setDraft] = useState({ bitacora: task.bitacora || "", metaCumplida: !!task.metaCumplida });
  const [dirty, setDirty] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [conflict, setConflict] = useState(false);
  const [recent, setRecent] = useState(null);
  const locked = task.estado !== "En Progreso";
  useEffect(() => {
    if (!dirty && !pending) {
      setBase(task); setDraft({ bitacora: task.bitacora || "", metaCumplida: !!task.metaCumplida });
    }
  }, [task, dirty, pending]);
  const change = fields => { setDraft(previous => ({ ...previous, ...fields })); setDirty(true); setMessage(""); };
  const save = async (review = false) => {
    if (pending || locked || conflict) return;
    setPending(true); setMessage("");
    try {
      const result = await onUpdateTask({ ...base, ...draft, ...(review ? { estado: "En Revisión" } : {}) });
      if (result?.conflict) { setConflict(true); setRecent(null); setMessage(result.message); }
      else if (!result) setMessage("No se pudo guardar. Tu borrador se conserva.");
      else { setBase(result); setDirty(false); setMessage("Cambios guardados."); }
    } catch { setMessage("No se pudo guardar. Tu borrador se conserva."); }
    finally { setPending(false); }
  };
  const refresh = async () => {
    try {
      const response = await apiFetch(ENDPOINTS.TAREAS), list = await response.json();
      const current = response.ok && Array.isArray(list) && list.find(item => String(item.id) === String(task.id));
      if (!current) throw new Error();
      setRecent(current);
    } catch { setMessage("No se pudo consultar la versión reciente. Tu borrador se conserva."); }
  };
  return <div className="space-y-2 text-xs">
    <div className="flex justify-between gap-2"><span><strong>Meta:</strong> {task.meta}</span>
      <label><input type="checkbox" checked={draft.metaCumplida} disabled={locked || pending} onChange={e => change({ metaCumplida: e.target.checked })} /> Meta cumplida</label></div>
    <label className="block">Bitácora anterior (sin fechas individuales)
      <textarea rows={3} value={draft.bitacora} readOnly className="mt-1 w-full rounded-xl border border-indigo-200 p-2.5" />
    </label>
    <TaskRecords key={task.id} taskId={task.id} refreshTag={task.ultimoRegistroId} canAdd={!locked}/>
    <TaskRecords taskId={task.id} refreshTag={task.ultimoRegistroId} kind="RECHAZO"/>
    {message && <p role="status">{message}</p>}
    {conflict && <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 space-y-2">
      <p>Tu borrador se conserva. Revisa los cambios de la otra sesión.</p>
      <button type="button" onClick={refresh} className="underline">Revisar versión reciente</button>
      {recent && <><p>Estado reciente: {recent.estado}. Meta cumplida: {recent.metaCumplida ? "Sí" : "No"}.</p>
        <pre className="whitespace-pre-wrap break-words">Bitácora reciente: {recent.bitacora || "(vacía)"}</pre>
        <button type="button" className="underline" onClick={() => { setBase(recent); setDraft(previous => ({ ...previous, bitacora: recent.bitacora || "" })); setRecent(null); setConflict(false); setMessage("Versión actualizada. Revisa tu borrador antes de guardar."); }}>Usar esta versión como base y conservar mi borrador</button></>}
    </div>}
    {!locked && <div className="flex justify-end gap-2">
      <button type="button" disabled={pending || conflict || !dirty} onClick={() => save()} className="rounded-lg bg-indigo-600 px-3 py-2 text-white disabled:opacity-50">Guardar bitácora y meta</button>
      <button type="button" disabled={pending || conflict} onClick={() => save(true)} className="rounded-lg bg-emerald-600 px-3 py-2 text-white disabled:opacity-50">Marcar como lista (enviar a aprobación)</button>
    </div>}
  </div>;
}
