# Cambios de TimeFlow V0.5.14-SNAPSHOT

- Filtro de tamaño para solicitudes sin Content-Length; HTTP 413 sobre 4 MiB de JSON.
- Validación de dependencias múltiples serializada mediante bloqueo de fila y transacciones READ_COMMITTED.
- Backend accesible únicamente desde 127.0.0.1 por defecto.
- Cuatro pruebas JUnit de regresión agregadas.

**Sin cambios en MySQL ni en la interfaz.** Consultar `Documentacion/Sprint6/AUDITORIA_SEGURIDAD_V0.5.14.md` para las limitaciones y pruebas pendientes.
