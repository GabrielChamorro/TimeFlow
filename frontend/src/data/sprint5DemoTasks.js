// Datos ficticios para probar 100 nodos en Vite (solo import.meta.env.DEV).
// No se escriben en MySQL ni se envían al backend.
export function createSprint5DemoTasks(count = 100) {
  const statuses = ["En Progreso", "En Revisión", "Finalizada"];
  return Array.from({ length: count }, (_, index) => ({
    id: 900000 + index,
    codigo: `DEMO-${String(index + 1).padStart(3, "0")}`,
    nombre: `Tarea de prueba ${index + 1}`,
    descripcion: `Nodo de prueba ${index + 1} utilizado para revisar la navegación y la selección del mapa.`,
    meta: `Comprobar el detalle del nodo ${index + 1} con 100 tareas en pantalla.`,
    bitacora: "Registro ficticio para la prueba de carga. No representa trabajo real.",
    estado: statuses[index % statuses.length],
    asignadoA: "Equipo de prueba",
    fecha: "2026-10-28",
    fechaLimite: "2026-11-08T18:00",
    metaCumplida: index % 4 === 0,
    posicionX: null,
    posicionY: null,
  }));
}
