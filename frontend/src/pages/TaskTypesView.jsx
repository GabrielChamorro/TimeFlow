import React, { useEffect, useMemo, useRef, useState } from "react";
import ConflictReview from "../components/ConflictReview.jsx";
import MotionPresence from "../components/MotionPresence.jsx";
import ConfirmDeactivation from "../components/ConfirmDeactivation.jsx";
import { getSessionEpoch } from "../config/session.js";
import { ENDPOINTS, apiFetch } from "../config/api_interaccion_backend";

const BLANK_DESCRIPTION = "Sin descripción detallada.";
const INPUT_CLASS = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:opacity-60";

function readMessage(error) {
  return error instanceof Error ? error.message : "No se pudo completar la operación";
}

export default function TaskTypesView({ taskTypes = [], onAddType, onUpdateType, onDeleteType, onReactivateType }) {
  const [adminTypes, setAdminTypes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("activas");
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editVersion,setEditVersion]=useState(null);
  const [conflict,setConflict]=useState(false);
  const [editNombre, setEditNombre] = useState("");
  const [editDescripcion, setEditDescripcion] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [pending, setPending] = useState(null);
  const [typeToDelete, setTypeToDelete] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const activeRequest = useRef(0);
  const mountedRef = useRef(false);

  const loadAll = async () => {
    const request = ++activeRequest.current;
    const session = getSessionEpoch();
    try {
      const response = await apiFetch(`${ENDPOINTS.TIPOS_TAREA}/administracion`);
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message || "No se pudo consultar el catálogo completo");
      if (!Array.isArray(data)) throw new Error("El servidor devolvió un catálogo inválido");
      if (mountedRef.current && activeRequest.current === request && session === getSessionEpoch()) setAdminTypes(data);
    } catch (err) {
      if (mountedRef.current && activeRequest.current === request && session === getSessionEpoch()) {
        setError(`${readMessage(err)}. Se muestran las plantillas activas disponibles.`);
      }
    } finally {
      if (mountedRef.current && activeRequest.current === request) setLoading(false);
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    loadAll();
    return () => { mountedRef.current = false; activeRequest.current += 1; };
  }, []);

  const records = Array.isArray(adminTypes) ? adminTypes : taskTypes;
  const stats = useMemo(() => ({
    total: records.length,
    active: records.filter((type) => type.activo !== false).length,
    inactive: records.filter((type) => type.activo === false).length,
  }), [records]);
  const filtered = useMemo(() => records.filter((type) => {
    const active = type.activo !== false;
    if (filter === "activas" && !active) return false;
    if (filter === "inactivas" && active) return false;
    const term = query.trim().toLocaleLowerCase("es");
    return !term || `${type.nombre ?? ""} ${type.descripcion ?? ""} ${type.id ?? ""}`.toLocaleLowerCase("es").includes(term);
  }).sort((a, b) => String(a.nombre).localeCompare(String(b.nombre), "es")), [records, filter, query]);

  const runAction = async (key, action, successMessage) => {
    if (pending) return false;
    setPending(key);
    setError("");
    setNotice("");
    try {
      const result = await action();
      if (!result) throw new Error("El servidor no confirmó la operación");
      if (mountedRef.current) {
        setNotice(successMessage);
        await loadAll();
      }
      return true;
    } catch (err) {
      if (mountedRef.current) {
        if (err.status===409 && key==="editar") setConflict(true);
        setError(readMessage(err));
      }
      return false;
    } finally {
      if (mountedRef.current) setPending(null);
    }
  };

  const create = async (event) => {
    event.preventDefault();
    const name = nombre.trim();
    if (!name) { setError("Escribe el nombre de la plantilla."); return; }
    const saved = await runAction("crear", () => onAddType({ nombre: name, descripcion: descripcion.trim() || BLANK_DESCRIPTION }), "Plantilla creada correctamente.");
    if (saved) { setNombre(""); setDescripcion(""); setFilter("activas"); setQuery(""); }
  };

  const saveEdit = async (event) => {
    event.preventDefault();
    if (conflict) return;
    const name = editNombre.trim();
    if (!name) { setError("El nombre de la plantilla no puede quedar vacío."); return; }
    const saved = await runAction("editar", () => onUpdateType(editingId, { nombre: name, descripcion: editDescripcion.trim() || BLANK_DESCRIPTION, version: editVersion }), "Plantilla actualizada.");
    if (saved) setEditingId(null);
  };

  const startEdit = (item) => {
    setEditingId(item.id); setEditVersion(item.version); setConflict(false);
    setEditNombre(item.nombre || "");
    setEditDescripcion(item.descripcion === BLANK_DESCRIPTION ? "" : item.descripcion || "");
    setExpandedId(item.id);
    setError("");
    setNotice("");
  };

  const deactivate = async () => {
    if (!typeToDelete || typeToDelete.activo === false) return;
    const saved = await runAction("desactivar", () => onDeleteType(typeToDelete.id, typeToDelete.version), "Plantilla desactivada. Sus datos se conservan.");
    if (saved) setTypeToDelete(null);
  };

  const openDeactivate = (item) => {
    if (pending || item.activo === false) return;
    setError(""); setNotice(""); setTypeToDelete(item);
  };

  const reactivate = async (item) => {
    await runAction(`activar-${item.id}`, () => onReactivateType(item.id), "Plantilla reactivada correctamente.");
  };

  return (
    <div className="space-y-6 pb-10">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-bold text-indigo-700 ring-1 ring-indigo-100">ADMINISTRACIÓN / PLANTILLAS</div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Tipos de tareas</h1>
          <p className="mt-1 text-sm text-slate-500">Crea y organiza las plantillas que usa el equipo al registrar tareas.</p>
        </div>
        <span className="rounded-xl border border-indigo-100 bg-white px-3 py-2 text-xs font-semibold text-indigo-700 shadow-sm">Acceso de administrador</span>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["Plantillas registradas", stats.total, "bg-slate-100 text-slate-700"],
          ["Activas", stats.active, "bg-emerald-50 text-emerald-700"],
          ["Desactivadas", stats.inactive, "bg-amber-50 text-amber-700"],
        ].map(([label, count, tint]) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <span className="text-xs font-semibold text-slate-500">{label}</span>
            <div className="mt-2 flex items-center justify-between"><strong className="text-3xl font-bold text-slate-900">{count}</strong><span className={`h-9 w-9 rounded-xl ${tint} grid place-items-center text-lg`}>▦</span></div>
          </div>
        ))}
      </div>

      {(error || notice) && <div role={error ? "alert" : "status"} className={`rounded-xl border px-4 py-3 text-sm ${error ? "border-rose-200 bg-rose-50 text-rose-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>{error || notice}</div>}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-4">
          <h2 className="font-bold text-slate-900">Nueva plantilla</h2>
          <p className="mt-1 text-xs text-slate-500">Ponle un nombre reconocible y una breve descripción.</p>
        </div>
        <form onSubmit={create} className="grid gap-4 p-5 lg:grid-cols-[1fr_1.4fr_auto] lg:items-end">
          <label className="block text-xs font-bold text-slate-700">Nombre
            <input className={`${INPUT_CLASS} mt-1.5`} value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej.: Auditoría de red" maxLength={100} required disabled={Boolean(pending)} />
          </label>
          <label className="block text-xs font-bold text-slate-700">Descripción
            <input className={`${INPUT_CLASS} mt-1.5`} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="¿En qué consiste este tipo de tarea?" maxLength={2000} disabled={Boolean(pending)} />
          </label>
          <button type="submit" disabled={Boolean(pending)} data-loading={pending === "crear"} className="h-[46px] rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50">
            {pending === "crear" ? "Guardando…" : "+ Crear plantilla"}
          </button>
        </form>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-5">
          <div>
            <h2 className="font-bold text-slate-900">Catálogo</h2>
            <p className="mt-0.5 text-xs text-slate-500">{filtered.length} resultado{filtered.length === 1 ? "" : "s"}{loading ? " · Actualizando…" : ""}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor="tf-search-types">Buscar plantillas</label>
            <input id="tf-search-types" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar plantilla…" className="min-w-[180px] rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-100" />
            <select aria-label="Filtrar plantillas" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700" value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="activas">Activas</option><option value="inactivas">Desactivadas</option><option value="todas">Todas</option>
            </select>
          </div>
        </div>
        {filtered.length === 0 ? (
          <div className="p-10 text-center"><div className="text-3xl text-slate-300">▦</div><h3 className="mt-2 font-semibold text-slate-800">No hay plantillas que mostrar</h3><p className="mt-1 text-sm text-slate-500">Prueba otra búsqueda o cambia el filtro.</p></div>
        ) : <div className="tf-ui-list divide-y divide-slate-100">
          {filtered.map((item) => {
            const active = item.activo !== false;
            const open = expandedId === item.id || editingId === item.id;
            return (
              <article key={item.id} className="tf-ui-item px-5 py-4 transition hover:bg-slate-50/70">
                <div className="flex flex-wrap items-center gap-3">
                  <button type="button" aria-label={`${open ? "Ocultar" : "Mostrar"} descripción de ${item.nombre}`} aria-expanded={open} onClick={() => setExpandedId(open ? null : item.id)} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-50 font-bold text-indigo-700 hover:bg-indigo-100">{String(item.nombre || "T").slice(0, 1).toUpperCase()}</button>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2"><h3 className="break-words font-semibold text-slate-900">{item.nombre}</h3><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{active ? "Activa" : "Desactivada"}</span></div>
                    <p className="mt-0.5 truncate text-xs text-slate-500">{item.descripcion || BLANK_DESCRIPTION}</p>
                  </div>
                  <div className="ml-auto flex flex-wrap gap-2">
                    {active ? <>
                      <button type="button" onClick={() => startEdit(item)} disabled={Boolean(pending)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 disabled:opacity-50">Editar</button>
                      <button type="button" onClick={() => openDeactivate(item)} disabled={Boolean(pending)} className="rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50">Desactivar</button>
                    </> : <button type="button" onClick={() => reactivate(item)} disabled={Boolean(pending) || !adminTypes} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50">{pending === `activar-${item.id}` ? "Reactivando…" : "Reactivar"}</button>}
                    <button type="button" onClick={() => setExpandedId(open ? null : item.id)} aria-expanded={open} className="tf-ui-expander rounded-lg px-2 text-xs text-slate-500 hover:bg-slate-100"><span className="tf-ui-chevron">▼</span></button>
                  </div>
                </div>
                {editingId === item.id ? (
                  <div>
                  {conflict && <ConflictReview key={editingId} endpoint={`${ENDPOINTS.TIPOS_TAREA}/administracion`} recordId={editingId}
                    fields={["nombre","descripcion","activo"]} active={record=>record.activo!==false}
                    onAdopt={record=>{ setEditVersion(record.version); setConflict(false); setError(""); setNotice("Versión actual cargada. Revisa el borrador antes de guardar."); }} />}
                  <form onSubmit={saveEdit} className="tf-ui-panel-enter mt-4 grid gap-3 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 md:grid-cols-2">
                    <label className="text-xs font-semibold text-slate-700">Nombre<input className={`${INPUT_CLASS} mt-1.5`} value={editNombre} onChange={(e) => setEditNombre(e.target.value)} maxLength={100} required disabled={Boolean(pending)} /></label>
                    <label className="text-xs font-semibold text-slate-700">Descripción<input className={`${INPUT_CLASS} mt-1.5`} value={editDescripcion} onChange={(e) => setEditDescripcion(e.target.value)} maxLength={2000} disabled={Boolean(pending)} /></label>
                    <div className="flex gap-2 md:col-span-2 md:justify-end"><button type="button" onClick={() => setEditingId(null)} disabled={Boolean(pending)} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600">Cancelar</button><button type="submit" disabled={Boolean(pending)} data-loading={pending === "editar"} className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">{pending === "editar" ? "Guardando…" : "Guardar cambios"}</button></div>
                  </form>
                  </div>
                ) : open ? <p className="tf-ui-panel-enter ml-0 mt-3 rounded-xl bg-slate-50 p-3 text-sm leading-relaxed text-slate-600 sm:ml-12">{item.descripcion || BLANK_DESCRIPTION}</p> : null}
              </article>
            );
          })}
        </div>}
      </section>

      <MotionPresence show={Boolean(typeToDelete)}>
        {typeToDelete && <ConfirmDeactivation key={typeToDelete.id} kind="taskType" record={typeToDelete} pending={pending === "desactivar"} error={error} onCancel={() => { if (!pending) setTypeToDelete(null); }} onConfirm={deactivate} />}
      </MotionPresence>
    </div>
  );
}
