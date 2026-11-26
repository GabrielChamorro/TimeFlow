# Cambios de V0.5.22 a V0.5.23

- Confirmación React para tareas/archivos, portal accesible, foco/teclado, Cancelar/X/Escape y bloqueo de doble envío. Cuentas y tipos conservan tres/dos pasos y texto de comprobación; se añade cierre explícito.
- DELETE admite versión capturada para tareas/cuentas/tipos/archivo, compara bajo el bloqueo apropiado y rechaza obsoletas409. Bajas preservan filas, contenido y trazabilidad. Parámetro opcional para compatibilidad; UI V23 siempre lo envía.
- Versión no numérica devuelve400 en el manejador de excepciones y no se confunde con sesión inválida401. Nueve pruebas Java adicionales y cuatro Node; las anteriores se conservan.
- Reutilización de tareas idénticas; marcador de nota solo clona su fila. Barrera temporal para respuestas iniciales/manuales posteriores a escrituras. No se recortan nodos/efectos para simular rendimiento.
- Historial reacciona a IDs finalizados, visibilidad y recuperación de red/5xx; aborta consultas y detalle al desmontar. Chat deriva el directorio recibido y cancela consultas de la sesión anterior.
- MotionPresence conserva animación con estado de presencia retenida, cierre inmediatamente inerte y nueva generación al abrir; se eliminan tres advertencias de refs/efecto. Chat elimina otra. Nueve advertencias restantes documentadas, sin apagar reglas.
- Helper Migrar_V0523 con respaldo previo y los tres SQL acumulados intactos, comprobados desde V19/V21. No hay columnas ni migración SQL nuevas V23.
- Versiones de compilados/metadatos y documentación V23; backlog conserva formato. Auditoría, matriz literal de28 criterios y evidencias separan aprobación técnica de aceptación/producción.

TaskClockRules y las reglas de tiempo no se modificaron. No se añadieron dependencias de producción, servicios externos, funciones de otro sprint ni configuración privada de usuario.
