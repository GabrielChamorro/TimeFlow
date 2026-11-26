# TimeFlow V0.5.11-SNAPSHOT

- Rediseño de **Tipos de tareas** y **Gestión de usuarios**.
- Filtros, búsqueda, contadores y recuperación de cuentas y plantillas inactivas.
- Respuestas de error visibles y formularios que esperan confirmación real.
- Listados completos solo para administradores y respuesta 409 ante conflictos de base de datos.
- Cierre de sesión controlado al cambiar la propia contraseña.
- Se mantienen los cambios anteriores: mapa, dependencias múltiples y evidencias.

Consultar `Documentacion/Sprint6/AUDITORIA_CODIGO_V0.5.11.md`.

No requiere migración de MySQL desde V0.5.10. No se pudieron ejecutar compilaciones completas con Maven o Vite aquí; sí se ejecutaron 45 pruebas Node.
