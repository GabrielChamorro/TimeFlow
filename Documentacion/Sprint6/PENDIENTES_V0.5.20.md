# Pendientes de TimeFlow V0.5.20-SNAPSHOT

Sprint 6 ABIERTO. No se propone cierre académico ni versión estable.

1. Ejecutar Chrome y Edge con perfiles desechables: F5, cerrar todas las pestañas, salir del proceso completo y reabrir, renovación/expiración, pérdida de red y cookies borradas/bloqueadas/vencidas. El control nativo de Chrome quedó sin habilitar por expiración de autorización; IAB y clientes HTTP no sustituyen estas pruebas.
2. Repetir tareas/cuentas/tipos en DOS interfaces autenticadas de administradores con almacenes de cookies independientes: misma versión, 200/409, mensaje, borrador conservado, valores actualizados, reintento; bajas, rol y movimiento. API con dos sesiones reales pasó; UI completa sigue pendiente.
3. Actualizar NVD con credencial disponible y repetir Dependency-Check; revisar nuevo resultado sin supresiones para ocultar hallazgos. Caché/avisos oficiales no equivalen al barrido actualizado completo. OSS Index también carece de credenciales.
4. Resolver/aceptar formalmente brechas de los originales: US-02 aviso al salir y duración; US-03 presencia por jornada; US-04 campos obligatorios; US-06 temporizadores; US-07 timestamp por nota; US-10 motivo obligatorio al rechazar; US-19 historial paginado y rango de fechas. Completar los demás criterios parciales de la matriz, sin declarar cumplimiento por inferencia.
5. Validar PNG/JPG/MP4/WEBM/PDF/DOCX y descargas en ambos navegadores, varios PDFs/páginas y corpus malicioso. PDF sintético corregido y visible en IAB; DOCX descargado abierto por Word, PDF por Poppler. No desactivar controles para admitir archivos peligrosos.
6. Medir rueda/arrastre continuos y comparación basal con 100 nodos; revisar carga prolongada, hardware y varias pestañas. Muestra rAF corta no certifica fluidez universal.
7. Definir operación del limitador en una o varias instancias. Reservas atómicas corrigen carrera local; reinicio reinicia contadores y servidores no comparten límites. No se requiere Redis por defecto; evaluar política persistente con su propia prueba de bloqueos falsos y expiración antes de cambiar arquitectura.
8. Probar recuperación ante interrupciones abruptas y restore integral con aplicación en el esquema restaurado. Restore SQL sintético pasó. Invalide familias y rote JWT_SECRET antes de abrir tráfico tras cualquier restore; no reintroduzca sesiones antiguas.
9. Revisar las advertencias restantes de lint de animaciones y sincronización de efectos/formularios con pruebas visuales; no desactivar reglas. Comprobar aceptación UX, actualización en tiempo real y despliegue online de RNF-1/2/3/4/5.
10. Confirmar con el equipo vigencia de criterios V0.5.0, cambios aprobados y aceptación académica. La copia no tiene historial Git: no se acredita integración en GitHub ni aportes individuales.

HTTPS local directo quedó comprobado; pendiente configuración TLS/proxy/certificado del despliegue real. V0.5.20 no introduce migración de esquema. Revisar AUDITORIA y RESULTADOS para límites exactos de cada evidencia.
