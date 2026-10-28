export default function Home() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Inicio</h1>
        <p className="text-gray-500">Resumen general del sistema.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 bg-white border border-gray-200 rounded-xl shadow-sm">
          <span className="text-sm font-medium text-gray-500">Total Usuarios</span>
          <p className="text-2xl font-bold text-gray-900 mt-2">1,248</p>
        </div>
        <div className="p-5 bg-white border border-gray-200 rounded-xl shadow-sm">
          <span className="text-sm font-medium text-gray-500">Proyectos Activos</span>
          <p className="text-2xl font-bold text-gray-900 mt-2">14</p>
        </div>
        <div className="p-5 bg-white border border-gray-200 rounded-xl shadow-sm">
          <span className="text-sm font-medium text-gray-500">Estado del Sistema</span>
          <p className="text-2xl font-bold text-emerald-600 mt-2">Operativo</p>
        </div>
      </div>
    </div>
  );
}