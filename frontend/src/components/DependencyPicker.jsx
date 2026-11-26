import React, { useState } from "react";
import { wouldCreateCycle } from "../utils/mapLayout.js";

// Selector reutilizable en la creación y edición: sin atajos de teclado ocultos.
export default function DependencyPicker({ tasks = [], taskId = null, value = [], onChange, disabled = false }) {
  const [query, setQuery] = useState("");
  const selected = new Set(value.map(String));
  const available = tasks.filter(task => taskId == null ||
    (String(task.id) !== String(taskId) &&
      (selected.has(String(task.id)) || !wouldCreateCycle(taskId, task.id, tasks))));
  const filtered = available.filter(task => `${task.nombre} ${task.codigo || task.id}`.toLowerCase().includes(query.toLowerCase().trim()));
  const toggle = (id) => {
    if (disabled) return;
    const key = String(id);
    onChange(selected.has(key) ? value.filter(v => String(v) !== key) : [...value, Number(id)]);
  };
  return (
    <div className="text-slate-600">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-[11px] font-semibold">Dependencias de la tarea (opcional)</span>
        <span className="text-[10px] font-semibold text-cyan-700">{selected.size} seleccionadas</span>
      </div>
      <input type="search" disabled={disabled} aria-label="Buscar tareas previas"
        placeholder="Buscar tarea por nombre o código..." value={query}
        onChange={e => setQuery(e.target.value)}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs mb-2 disabled:bg-slate-100" />
      <div role="group" aria-label="Seleccionar tareas previas" className="max-h-36 overflow-y-auto rounded-lg border border-slate-200 bg-white divide-y divide-slate-100">
        {filtered.map(task => {
          const checked = selected.has(String(task.id));
          return <label key={task.id} className={`flex gap-2 items-start px-3 py-2 text-xs ${disabled ? "opacity-65" : "cursor-pointer hover:bg-cyan-50"}`}>
            <input type="checkbox" disabled={disabled} checked={checked} onChange={() => toggle(task.id)} className="mt-0.5 accent-cyan-600" />
            <span className="min-w-0 flex-1"><span className="block font-semibold truncate" title={task.nombre}>{task.nombre}</span>
            <span className="text-[10px] text-slate-400">{task.codigo || task.id}</span></span>
          </label>;
        })}
        {!filtered.length && <p className="text-xs text-slate-400 p-3">No hay tareas disponibles.</p>}
      </div>
      {!!selected.size && <button type="button" disabled={disabled} className="mt-1 text-[11px] text-cyan-700 hover:underline disabled:opacity-60"
        onClick={() => onChange([])}>Quitar todas</button>}
      <p className="text-[10px] text-slate-500 mt-1">Puedes marcar varias tareas. Cada una tendrá su flecha hacia esta tarea.</p>
    </div>
  );
}
