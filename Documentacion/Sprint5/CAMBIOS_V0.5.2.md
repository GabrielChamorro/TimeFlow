# TimeFlow V0.5.2-SNAPSHOT - Avance del Sprint 5

Base: V0.5.1-SNAPSHOT. Sprint 5 aún en desarrollo.

## Qué cambió

- Los 100 nodos de `?demoSprint5=100` ahora responden a clic, Enter y espacio.
- Se muestra una ventana con código, nombre, estado, responsable ficticio, fechas, meta, descripción y bitácora de prueba.
- El detalle es solo lectura. Es un componente distinto a `TaskModal` y no recibe acciones para modificar datos.
- Se puede cerrar con los botones, Escape o un clic fuera de la ventana.
- No cambian las rutas del backend, la base de datos, los permisos ni el flujo de tareas reales.
- Se añaden cuatro pruebas con `node --test` para los datos ficticios y la separación del componente.

## Comprobaciones necesarias en Windows

1. En `frontend`, ejecutar `npm ci`, `npm run test:sprint5` y `npm run build`.
2. Iniciar frontend y backend, abrir `http://localhost:5173/?demoSprint5=100` y acceder a Monitoreo.
3. Abrir varios nodos de los 100 y cerrar el detalle con Escape y los botones.
4. Confirmar que no aparecen botones para guardar, borrar, aprobar o devolver tareas en la demo.
5. Repetir la selección en monitoreo normal, con una tarea real, y verificar que sigue funcionando.
6. Comprobar que los registros ficticios no aparecen en MySQL.
7. Ejecutar JUnit y Postman en el equipo donde están instaladas las dependencias.
8. Medir rendimiento con `scripts/PROBAR_RENDIMIENTO_API_SPRINT5.ps1` y registrar resultados.

**Estado:** Modificación implementada y pruebas de código ejecutadas. Falta validación visual en navegador real del usuario. No se declara cerrado el Sprint 5.
