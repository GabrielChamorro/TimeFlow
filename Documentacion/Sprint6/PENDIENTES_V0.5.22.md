# Pendientes para certificación final de TimeFlow V0.5.22

Sprint 6 ABIERTO. US-03 y US-06 están implementadas y verificadas técnicamente en el alcance local. No se requiere otra versión intermedia para instalarlas desde V0.5.19.

1. RNF-2 y parte online de US-13: publicar en un entorno autorizado con HTTPS, orígenes exactos y configuración productiva; verificar acceso externo real. Localhost no certifica producción.
2. RNF-4/US-13: prueba prolongada de 100 nodos con rueda/arrastre continuos, comparación contra menos nodos, recursos y dispositivos/navegadores. Hay dos muestras rAF nuevas de 30 s, con 21/33 intervalos >50 ms; no demuestran ausencia de degradación ni latencia de entrada.
3. RNF-1: aceptación de usabilidad con usuarios representativos. La inspección visual IAB y el Word no sustituyen una evaluación de usuarios.
4. US-20: certificar Cancelar y cerrar para TODOS los diálogos, incluidos archivos, cuentas y tipos, en navegadores objetivo. Cancelar tarea y vista previa están comprobados. El intento de archivo nativo terminó en timeout y desactivación sintética; no se cuenta como cancelación aprobada.
5. RNF-3 y RNF-5 operativos: medir latencia de jornada/tareas/métricas y de cada gesto en redes reales, pestañas con throttling y desconexión/reconexión prolongada. Hay comprobaciones sin F5 y latencia medida de presencia; el sondeo es de 5 s y no garantiza simultaneidad instantánea. El pan 1:1, rueda y Escape están comprobados en IAB.
6. Certificación completa Chrome/Edge nativos, reinicio total de sus procesos y dos perfiles UI independientes. Dos pestañas IAB y sesiones HTTP reales no sustituyen ese alcance.
7. Restauración operativa integral con aplicación/login y fallos abruptos; el respaldo automático V19, restore SQL y migración están comprobados. Invalidar sesiones y rotar JWT_SECRET antes de abrir tráfico de un restore.
8. NVD/backend actualizado y revisión de despliegue distribuido. npm audit actual sin alertas no acredita ausencia de vulnerabilidades. El limitador en memoria no comparte contadores entre procesos y reiniciar los reinicia; definir operación según despliegue, sin añadir servicios innecesarios.
9. Escalabilidad: carga general inicial del mapa y recarga completa solo al cambiar versiones. El historial continúa paginado en SQL; medir volúmenes grandes y evidencia antigua inline antes de ampliar a cargas mayores. Directorio de colaboradores/plantillas conserva la carga inicial/manual previa; no se promete sincronización integral de todos los catálogos.
10. Revisar advertencias de lint de animación/sincronización con pruebas visuales. Reglas intactas. Compatibilidad nativa y corpus hostil amplio PDF/Word/video siguen como certificación adicional; no se repitió su apertura nativa completa.
11. Confirmar vigencia y aceptación académica de los criterios originales V0.5.0 con el equipo. La copia carece de historial Git y no permite acreditar integración remota ni aportes individuales.

Reglas que requieren aceptación operativa explícita al certificar: el reloj acumula En Progreso aunque termine la jornada; revisión/baja lo detienen; rechazar/reactivar reanuda. Legado sin información fiable permanece Tiempo no registrado. No reconstruir fechas o duraciones históricas sin fuente autorizada.

Ningún pendiente se oculta mediante una prueba simulada ni se delegó al usuario como tarea manual durante esta entrega. La base personal no se modificó.
