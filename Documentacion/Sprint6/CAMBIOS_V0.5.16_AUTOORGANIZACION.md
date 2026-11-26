# TimeFlow V0.5.16-SNAPSHOT — Autoorganización de Monitoreo Espacial

## Qué se implementó

- Botón **Autoorganizar**, visible solo para administradores, al mostrar todos los colaboradores.
- Vista previa reversible: **Aplicar distribución** o **Cancelar**. La vista previa no modifica MySQL.
- Criterio principal: cada tarea queda después de sus dependencias explícitas, incluso con varios requisitos.
- Criterio secundario: fecha límite de la tarea, más urgente primero dentro de cada nivel.
- Criterio adicional: proximidad a las tareas previas cuando hay fechas empatadas; no garantiza el mínimo matemático de cruces.
- Tareas sin dependencias se agrupan desde la izquierda. Hasta diez tareas por columna para evitar una columna vertical enorme.
- Espacios de 292 px en horizontal y 205 px en vertical, para evitar superposición de tarjetas.
- Dependencias circulares: se detiene el cálculo con un aviso en lugar de bloquear React.
- Referencias a tareas que ya no estén activas: se omiten del dibujo sin inventar nodos.
- Vista previa en modo solo lectura: el arrastre de tareas queda temporalmente suspendido.
- Si se cancela, se recupera la vista/cámara anterior.
- **Un único PATCH `/api/tareas/posiciones`**, con autorización de administrador y transacción.
- El backend valida todos los IDs, rechaza duplicados, posiciones inválidas y cambios conflictivos antes de guardar.
- El guardado usa bloqueos sobre las filas para impedir escrituras parciales o sobrescrituras de posiciones que cambian entre la vista previa y la confirmación.
- El arrastre manual usa también bloqueo de fila durante su PATCH individual.
- El frontend comprueba que el servidor confirme todas las posiciones antes de actualizar la vista.

## Uso

1. Iniciar frontend y backend de V0.5.16, iniciar sesión como administrador.
2. Abrir **Monitoreo Espacial** y seleccionar **Todos los colaboradores**.
3. Pulsar **Autoorganizar** para previsualizar.
4. **Cancelar** para mantener todas las posiciones o **Aplicar distribución** para guardarlas.
5. Tras aplicar, recargar o volver a abrir Monitoreo Espacial para verificar que MySQL conservó las posiciones.

## Límites y comprobaciones

- Máximo de 1000 cambios por operación de guardado.
- No hay migraciones de base de datos en esta versión.
- Se ejecutaron 69 pruebas Node de frontend: todas aprobadas. Se añadieron 5 pruebas JUnit de validación/permiso/atomicidad, pendientes de ejecutar con Maven en Windows.
- Se verificó la sintaxis de los archivos JS/JSX y las importaciones relativas. La compilación real Vite y las pruebas MySQL siguen pendientes en este entorno.
- Si aparece HTTP 409, significa que otra sesión movió una tarea o quedó inactiva: actualizar datos y volver a calcular.
- La aplicación en caso de corte de red **no debe darse por confirmada** hasta recargar y verificar el servidor.
- Ninguna prueba del Sprint 6 se debe presentar como cierre definitivo hasta ejecutar el backend, Vite y los escenarios reales.
