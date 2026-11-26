import { useEffect, useRef, useState } from "react";
import { ENDPOINTS, apiFetch } from "../config/api_interaccion_backend.js";
import { getSessionEpoch } from "../config/session.js";

export default function HistoryView({ onOpenTask, refresh = 0 }) {
  const [draft, setDraft] = useState({ query: "", desde: "", hasta: "" });
  const [filters, setFilters] = useState(draft);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [data, setData] = useState({ content: [], totalElements: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [opening, setOpening] = useState(null);
  const detailRequest = useRef(null);
  useEffect(() => () => { detailRequest.current?.abort(); detailRequest.current = null; }, []);
  useEffect(() => {
    let cancelled = false, busy = false, failed = false, controller;
    const epoch = getSessionEpoch();
    const update = async () => {
      if (cancelled || busy) return;
      busy = true; controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 10000);
      try {
        const params = new URLSearchParams({ ...filters, page: String(page), size: String(size) });
        const response = await apiFetch(`${ENDPOINTS.TAREAS}/historial?${params}`, {signal:controller.signal});
        failed = response.status >= 500;
        const result = await response.json();
        if (!response.ok) { failed = response.status >= 500; throw new Error(result.message || "No se pudo consultar el historial."); }
        if (!Array.isArray(result.content)) { failed = true; throw new Error("Respuesta de historial inválida."); }
        failed = false;
        if (!cancelled && epoch === getSessionEpoch()) { setData(result); setError(""); }
      } catch (err) {
        if (err.name === "TypeError" || err.name === "AbortError" || err.name === "SyntaxError") failed = true;
        if (!cancelled && epoch === getSessionEpoch()) setError(err.message);
      } finally { window.clearTimeout(timeout); busy = false; if (!cancelled) setLoading(false); }
    };
    update();
    // El marcador de finalizadas dispara actualizaciones; solo sondear para recuperar un fallo de red/servidor.
    const retry = window.setInterval(() => { if (failed) update(); }, 5000);
    const visible = () => { if (!document.hidden) update(); };
    document.addEventListener("visibilitychange", visible);
    return () => { cancelled = true; controller?.abort(); window.clearInterval(retry); document.removeEventListener("visibilitychange", visible); };
  }, [filters, page, size, refresh]);
  const search = event => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const submitted = Object.fromEntries(["query", "desde", "hasta"].map(key => [key, String(form.get(key) || "")]));
    if (submitted.desde && submitted.hasta && submitted.desde > submitted.hasta) { setError("La fecha Desde no puede ser posterior a Hasta."); return; }
    setLoading(true); setError(""); setPage(0); setDraft(submitted); setFilters(submitted);
  };
  const open = async id => {
    if (detailRequest.current) return;
    const controller = new AbortController();
    detailRequest.current = controller;
    const epoch = getSessionEpoch();
    setOpening(id); setError("");
    try {
      const response = await apiFetch(`${ENDPOINTS.TAREAS}/${id}`, { signal: controller.signal });
      if (!response.ok) throw new Error("No se pudo abrir el detalle de esta tarea.");
      const task = await response.json();
      if (!controller.signal.aborted && epoch === getSessionEpoch()) onOpenTask(task);
    } catch (err) { if (!controller.signal.aborted && epoch === getSessionEpoch()) setError(err.message); }
    finally { if (detailRequest.current === controller) { detailRequest.current = null; setOpening(null); } }
  };
  return <section aria-label="Historial de tareas finalizadas" className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
    <h2 className="text-lg font-bold text-slate-900">Historial de tareas finalizadas</h2>
    <p className="text-xs text-slate-500">Fechas de cierre en UTC. Los registros anteriores sin fecha de cierre verificable se muestran sin fecha y no aparecen al filtrar por un rango.</p>
    <form onSubmit={search} className="flex flex-wrap items-end gap-3 text-xs">
      <label>Buscar tarea, código o responsable<input name="query" className="block rounded-lg border p-2" maxLength={180} value={draft.query} onChange={e => setDraft(v => ({ ...v, query: e.target.value }))}/></label>
      <label>Desde (cierre UTC)<input name="desde" className="block rounded-lg border p-2" type="date" value={draft.desde} onChange={e => setDraft(v => ({ ...v, desde: e.target.value }))}/></label>
      <label>Hasta (cierre UTC)<input name="hasta" className="block rounded-lg border p-2" type="date" value={draft.hasta} onChange={e => setDraft(v => ({ ...v, hasta: e.target.value }))}/></label>
      <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-white">Buscar historial</button>
      <label>Registros por página<select className="block rounded-lg border p-2" value={size} onChange={e => { setLoading(true); setSize(Number(e.target.value)); setPage(0); }}><option value={10}>10</option><option value={20}>20</option><option value={50}>50</option></select></label>
    </form>
    {loading && <p role="status">Cargando historial…</p>}
    {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
    {!error && <>
      <p className="text-sm">{data.totalElements} tarea(s) finalizada(s)</p>
      <div className="overflow-x-auto"><table className="w-full text-left text-xs">
        <thead><tr>{["Tarea", "Responsable", "Creación", "Cierre UTC", "Estado", "Detalle"].map(label => <th key={label} className="border-b p-2">{label}</th>)}</tr></thead>
        <tbody>{data.content.map(task => <tr key={task.id}>
          <td className="border-b p-2"><strong>{task.nombre}</strong><br/>{task.codigo}</td>
          <td className="border-b p-2">{task.responsable}</td><td className="border-b p-2">{task.fechaCreacion || "No registrada"}</td>
          <td className="border-b p-2">{task.finalizadaEnMs == null ? "Fecha no registrada" : new Date(task.finalizadaEnMs).toLocaleString("es-CL", { timeZone: "UTC" })}</td>
          <td className="border-b p-2">{task.estado}</td>
          <td className="border-b p-2"><button type="button" disabled={opening != null || loading} className="text-indigo-700 underline" aria-label={`Ver detalles ${task.nombre}`} onClick={() => open(task.id)}>Ver detalles</button></td>
        </tr>)}</tbody>
      </table></div>
      {!loading && data.content.length === 0 && <p>No hay tareas finalizadas para estos filtros.</p>}
      <div className="flex items-center gap-4 text-sm">
        <button type="button" disabled={loading || page === 0} onClick={() => { setLoading(true); setPage(v => v - 1); }}>Página anterior del historial</button>
        <span>Página {page + 1} de {Math.max(1, data.totalPages)}</span>
        <button type="button" disabled={loading || page + 1 >= data.totalPages} onClick={() => { setLoading(true); setPage(v => v + 1); }}>Página siguiente del historial</button>
      </div>
    </>}
  </section>;
}
