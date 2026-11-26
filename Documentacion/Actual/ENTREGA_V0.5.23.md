# TimeFlow V0.5.23-SNAPSHOT

Sprint6 abierto. Correcciones de confirmaciones/bajas y sincronización, regresión técnica local y recuperación completa. No certifica estabilidad productiva ni aceptación final. Ver Documentacion/Sprint6/INFORME_V0.5.23.md, AUDITORIA_V0.5.23.md, RESULTADOS_V0.5.23.md, TRAZABILIDAD_V0.5.23.md y PENDIENTES_V0.5.23.md.

Desde la instalación personal V0.5.19: usar directamente este ZIP completo, respaldar y ejecutar scripts/Migrar_V0523.ps1 con los tres SQL acumulados y parámetros autorizados. No instalar versiones intermedias. V23 no añade columnas. JAR en bin/backend-0.5.23-SNAPSHOT.jar y frontend compilado en frontend/dist; Java21 actualizado. Instrucciones detalladas de respaldo, variables privadas, HTTPS y recuperación en INSTALAR_Y_MIGRAR_V0.5.23.md. No se ejecutó nada sobre la base personal.

El ZIP de cambios contiene solo fuentes nuevas/modificadas respecto al completo V22; requiere recompilar frontend/backend juntos. Las copias separadas corresponden exactamente al completo/delta. MANIFIESTO_SHA256.json cubre todos los artefactos separados, incluido este LEEME; ARCHIVOS_CAMBIADOS.json enumera la comparación SHA256 sin borrados. CRC y reconstrucción independiente del delta verificados en la auditoría de entrega.

US20 local: Cancelar/X/Escape y confirmaciones cotejadas con MySQL. Chrome login observado; al solicitar F5 Computer Use bloqueó el control por no poder verificar la URL. Resto nativo/perfiles independientes, fluidez visual100 nodos, NVD actualizado, online y usuarios reales pendientes. No se eludieron permisos ni se sustituyeron pruebas nativas por HTTP. NVD anónimo devolvió503. Los relojes conservan la regla aceptada de tiempo de desarrollo transcurrido, incluso después de Check-out.

Fuentes y evidencias históricas se conservan por versión. Sin node_modules, cachés, bases/dumps, secretos, perfiles de prueba ni configuraciones privadas. Los PDF/PNG de QA del backlog quedan excluidos; capturas de pruebas UI sí se incluyen como evidencias. Todos los resultados por suite se solapan y no deben sumarse.
