import React, { useState } from "react";

export default function TaskTypesView({
  taskTypes = [],
  onAddType,
  onUpdateType,
  onDeleteType,
}) {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  // Estados para edición en línea
  const [editingId, setEditingId] = useState(null);
  const [editNombre, setEditNombre] = useState("");
  const [editDescripcion, setEditDescripcion] = useState("");

  // Estado para confirmación de eliminación
  const [typeToDelete, setTypeToDelete] = useState(null);

  const handleCreate = (e) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    onAddType({
      nombre: nombre.trim(),
      descripcion: descripcion.trim() || "Sin descripción detallada.",
    });

    setNombre("");
    setDescripcion("");
  };

  const startEditing = (item, e) => {
    e.stopPropagation();
    setEditingId(item.id);
    setEditNombre(item.nombre);
    setEditDescripcion(item.descripcion || "");
  };

  const handleSaveEdit = (id, e) => {
    e.stopPropagation();
    if (!editNombre.trim()) return;

    onUpdateType(id, {
      nombre: editNombre.trim(),
      descripcion: editDescripcion.trim() || "Sin descripción detallada.",
    });
    setEditingId(null);
  };

  const confirmDelete = () => {
    if (typeToDelete) {
      onDeleteType(typeToDelete.id);
      setTypeToDelete(null);
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Catálogo de Tipos de Tareas</h2>
          <p className="text-xs text-slate-500">
            Administración de plantillas preestablecidas sincronizadas con la base de datos.
          </p>
        </div>
        <span className="text-xs font-semibold px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full border border-indigo-200">
          Solo Administrador
        </span>
      </div>

      {/* Formulario de Creación */}
      <form onSubmit={handleCreate} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-slate-900">Añadir Nueva Plantilla de Tarea</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Nombre de la Tarea</label>
            <input
              type="text"
              placeholder="Ej. Auditoría de Red"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Descripción</label>
            <input
              type="text"
              placeholder="Ej. Escaneo de vulnerabilidades y servicios activos"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer"
          >
            + Guardar Plantilla
          </button>
        </div>
      </form>

      {/* Listado de Plantillas */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-900">Plantillas Registradas ({taskTypes.length})</h3>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {taskTypes.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No hay tipos de tarea registrados en la base de datos.
            </div>
          ) : (
            taskTypes.map((item, index) => (
              <div key={item.id || index} className="transition-colors">
                {editingId === item.id ? (
                  <div className="p-4 bg-slate-50 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={editNombre}
                        onChange={(e) => setEditNombre(e.target.value)}
                        placeholder="Nombre de tarea"
                        className="p-2 text-xs border border-indigo-300 rounded-lg focus:outline-none ring-1 ring-indigo-500 bg-white"
                      />
                      <input
                        type="text"
                        value={editDescripcion}
                        onChange={(e) => setEditDescripcion(e.target.value)}
                        placeholder="Descripción de la tarea"
                        className="p-2 text-xs border border-indigo-300 rounded-lg focus:outline-none ring-1 ring-indigo-500 bg-white"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={(e) => handleSaveEdit(item.id, e)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-xs cursor-pointer"
                      >
                        Guardar
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingId(null);
                        }}
                        className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium rounded-lg text-xs cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => toggleExpand(item.id)}
                    className="p-4 hover:bg-slate-50/80 cursor-pointer flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-500 flex items-center justify-center font-mono font-bold text-[11px]">
                          {index + 1}
                        </span>
                        <span className="font-semibold text-slate-900 text-sm">{item.nombre}</span>
                        <span className="text-[10px] text-slate-400 font-mono">(ID: {item.id})</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => startEditing(item, e)}
                          className="px-3 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 font-medium rounded-lg text-xs transition-colors cursor-pointer"
                        >
                          Editar
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setTypeToDelete(item);
                          }}
                          className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 font-medium rounded-lg text-xs transition-colors cursor-pointer"
                        >
                          Eliminar
                        </button>
                        <span className="text-slate-400 text-xs ml-1">
                          {expandedId === item.id ? "▲" : "▼"}
                        </span>
                      </div>
                    </div>

                    {expandedId === item.id && (
                      <div className="mt-2 ml-9 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 text-slate-700">
                        <p className="text-[11px] font-semibold text-indigo-900 mb-0.5">Descripción de la plantilla:</p>
                        <p className="text-xs leading-relaxed text-slate-600">{item.descripcion}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal de Confirmación para Eliminación */}
      {typeToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-xl font-bold mx-auto">
              !
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900">¿Estás seguro?</h4>
              <p className="text-xs text-slate-500 mt-1">
                Estás a punto de eliminar la plantilla <strong className="text-slate-800">"{typeToDelete.nombre}"</strong>. La eliminación será permanente en la base de datos.
              </p>
            </div>
            <div className="flex gap-2 justify-center pt-2">
              <button
                onClick={() => setTypeToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl text-xs transition-colors shadow-xs cursor-pointer"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}