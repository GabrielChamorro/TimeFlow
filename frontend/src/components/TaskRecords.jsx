import { useEffect, useState } from "react";
import { ENDPOINTS, apiFetch } from "../config/api_interaccion_backend.js";

export default function TaskRecords({ taskId, canAdd = false, kind = "NOTA", refreshTag }) {
  const [page, setPage] = useState(0);
  const [data, setData] = useState({ content: [], totalPages: 0, totalElements: 0 });
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const url = `${ENDPOINTS.TAREAS}/${taskId}/registros`;
  useEffect(() => {
    let cancelled = false;
    apiFetch(`${url}?tipo=${kind}&page=${page}&size=20`).then(async response => {
      const result = await response.json();
      if (!response.ok || !Array.isArray(result.content)) throw new Error();
      if (!cancelled) { setData(result); setError(""); }
    }).catch(() => { if (!cancelled) setError("No se pudo cargar el historial. Tu nota se conserva."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [url, kind, page, refresh, refreshTag]);
  const add = async () => {
    if (pending || !draft.trim()) return;
    setPending(true); setError("");
    try {
      const response = await apiFetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contenido: draft }) });
      if (!response.ok) { const result = await response.json().catch(() => ({})); throw new Error(result.message || "No se pudo guardar la nota. Tu texto se conserva."); }
      setDraft(""); setRefresh(value => value + 1);
    } catch (err) { setError(err.message); }
    finally { setPending(false); }
  };
  return <section aria-label={kind === "NOTA" ? "Notas con fecha y autor" : "Historial de rechazos"} className="space-y-2 rounded-xl border border-slate-200 p-3 text-xs">
    <h4 className="font-semibold">{kind === "NOTA" ? "Notas con fecha y autor" : "Historial de rechazos"} ({data.totalElements})</h4>
    {loading && <p role="status">Cargando registros…</p>}
    {error && <p role="alert" className="text-rose-700">{error}</p>}
    <ol className="space-y-2">{data.content.map(item => <li key={item.id} className="border-b border-slate-100 pb-2">
      <p className="font-semibold">{item.autorNombre || "Autor anterior no registrado"} · {item.creadoEnMs == null ? "Fecha original no registrada" : <time dateTime={new Date(item.creadoEnMs).toISOString()}>{new Date(item.creadoEnMs).toLocaleString()}</time>}</p>
      <p className="whitespace-pre-wrap break-words">{item.contenido}</p>
    </li>)}</ol>
    <div className="flex items-center gap-3">
      <button type="button" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Registros anteriores</button>
      <span>Página {page + 1} de {Math.max(1, data.totalPages)}</span>
      <button type="button" disabled={page + 1 >= data.totalPages} onClick={() => setPage(p => p + 1)}>Registros siguientes</button>
      <button type="button" onClick={() => setRefresh(v => v + 1)}>Actualizar registros</button>
    </div>
    {canAdd && kind === "NOTA" && <div className="space-y-2">
      <label className="block">Nueva nota<textarea className="mt-1 w-full rounded-lg border p-2" rows={3} maxLength={10000} value={draft} disabled={pending} onChange={e => setDraft(e.target.value)}/></label>
      <button type="button" disabled={pending || !draft.trim()} onClick={add} className="rounded-lg bg-indigo-600 px-3 py-2 text-white disabled:opacity-50">{pending ? "Guardando nota…" : "Agregar nota"}</button>
    </div>}
  </section>;
}
