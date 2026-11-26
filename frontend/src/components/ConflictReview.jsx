import React, { useState } from "react";
import { apiFetch } from "../config/api_interaccion_backend.js";
export default function ConflictReview({ endpoint, recordId, fields, active, onAdopt }) {
  const [record,setRecord]=useState(null), [error,setError]=useState("");
  const load=async()=>{
    try {
      const response=await apiFetch(endpoint), list=await response.json();
      if (!response.ok || !Array.isArray(list)) throw new Error();
      const current=list.find(row=>String(row.id)===String(recordId));
      if (!current) throw new Error();setRecord(current);setError("");
    } catch { setError("No se pudieron consultar los datos actuales. Tu borrador se conserva."); }
  };
  return <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 space-y-2 text-sm">
    <p>Otra sesión modificó este registro. Tu borrador sigue en el formulario.</p>
    <button type="button" onClick={load} className="underline">Revisar valores actuales</button>
    {error && <p role="alert">{error}</p>}
    {record && <><dl>{fields.map(field=><div key={field}><dt className="font-semibold">{field}</dt><dd className="whitespace-pre-wrap break-words">{String(record[field] ?? "")}</dd></div>)}</dl>
      {active(record) ? <button type="button" onClick={()=>onAdopt(record)} className="underline">Usar versión actual conservando mi borrador</button>
      : <p>El registro está desactivado. No se permite guardar este borrador.</p>}</>}
  </div>;
}
