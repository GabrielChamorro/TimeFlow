# Pendientes de V0.5.19-SNAPSHOT

Sprint 6 abierto. Se resolvieron la pérdida de sesión con F5, revocación persistente y conflictos de tareas/cuentas/tipos dentro del alcance probado.

- Faltan las definiciones y criterios originales de US-01…US-23 y RNF-1…RNF-5 para cerrar su matriz de aceptación.
- NVD transitivo del backend actualizado y OSS Index requieren credenciales; no se repitió ni certificó la auditoría general.
- Falta cerrar y reiniciar el proceso completo de un navegador de escritorio. Se verificó F5 y cerrar/reabrir la pestaña con cookie persistente, sin equiparar esos casos a reiniciar el proceso.
- HTTPS/proxy y cookies Secure se probaron como configuración/unidad, no como despliegue real. Falta matriz completa de navegadores, partición/borrado de cookies y despliegue en varios servidores.
- Rate limiting en memoria, XSS, antivirus/CDR, apertura completa de documentos y visor PDF protegido siguen requiriendo trabajo. HttpOnly reduce exposición de renovación, sin impedir acciones de XSS durante una sesión activa.
- Persiste el alcance pendiente de accesibilidad, carga prolongada, FPS, pérdida de respuesta después de COMMIT, cortes eléctricos y restauración de respaldo de producción. No se probó el asistente de backup con una base personal.
- La ventana de duplicados de renovación es 5 s: devuelve 409 sin credenciales. Reutilización posterior revoca la familia. Web Locks coordina pestañas cuando está disponible; faltan ensayos distribuidos de pérdidas de red y todas las intercalaciones.
- La limpieza de sesiones caducadas es acotada por nuevos logins; puede quedar mantenimiento de filas caducadas si no hay logins. No autentican. Documentar limpieza programada en la operación real.
- Lint mantiene 26 advertencias sin errores. No se desactivaron reglas ni pruebas para aprobar.

No se promete ausencia de vulnerabilidades desconocidas ni se declara finalizado el Sprint 6.
