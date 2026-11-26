# Informe de finalización técnica TimeFlow V0.5.23

La continuación parte del ZIP completo exacto V0.5.22: doce artefactos y sus copias se cotejaron antes de modificar, y626 archivos de fuente se tomaron como línea base. Se conserva el proyecto, sus funcionalidades, criterios y migraciones, sin iniciar Sprint7 ni modificar la instalación personal. La entrega es SNAPSHOT para revisión; se recomienda mantener el Sprint6 abierto por las comprobaciones técnicas visuales y operativas pendientes.

US-20 se resolvió en alcance técnico local: confirmación React explícita para tareas/archivos; cuentas/tipos mantienen sus pasos y texto. Cancelar/X/Escape y Confirmar se contrastaron con MySQL. La versión capturada detecta cambios entre abrir y confirmar; el conflicto de tarea deja intacto el borrador. Se corrigió el400 que antes salía401 al enviar una versión inválida. RESULTADOS y fallos-y-correcciones.json describen prueba, causa demostrada y límites de cada corrección.

Se redujo reemplazo de objetos sin cambios, se añadió invalidación/reintento del historial y se abortaron consultas tardías del detalle/chat. No se añadió arquitectura de tiempo real: el sondeo5s se mantiene. La mejora de99 identidades de100 es demostrable; no se utiliza para afirmar FPS. Las pruebas de cálculo, API100 nodos/294 vínculos y carga HTTP incluyen CPU/memoria en su alcance. La fluidez visual comparativa/prolongada sigue sin certificar.

Los cronómetros conservan exactamente la regla aceptada: En Progreso acumula también tras Check-out; revisión/baja pausan, rechazo/reactivación reanudan y finalización detiene. La jornada laboral se mide aparte. TaskClockRules no cambió. Legados sin timestamps permanecen desconocidos. No se hicieron cambios cosméticos de reloj para reducir tiempos nocturnos.

La recuperación completa amplía la evidencia anterior: respaldo de todas las tablas/BLOB, importación interrumpida y repetida, integridad y arranque del backend restaurado con login, revocación y clave nueva. Se repitió la autenticación de la copia con el JAR definitivo. Seguridad revisa fuentes oficiales, npm y OWASP; la caché NVD no está al día y actualizar falló503. Java de prueba se actualizó de forma portable, dejando intacta la instalación personal. Ver AUDITORIA para superficie y límites del limitador por proceso.

Chrome y Edge estaban instalados. El login Chrome se observó en un perfil desechable; al solicitar F5, Computer Use bloqueó el control al no poder determinar la URL con suficiente confianza. Se cerró esa fase y no se usaron vías alternativas de automatización. Edge, dos perfiles nativos independientes y el resto de la matriz visual quedan explícitamente sin certificar. Las pruebas IAB anteriores al bloqueo y las HTTP posteriores son evidencias diferentes. No se pidió al usuario resolver pasos que aún podían completarse por herramientas autorizadas.

## Respuestas para la decisión de cierre

| Pregunta | Respuesta sustentada |
|---|---|
| ¿Todas las historias originales implementadas? | Hay implementación existente para US-01–US-23 y mejoras verificadas; algunas filas siguen parciales por criterios visuales/operativos. No se afirma cumplimiento integral solo por existir código. Matriz conserva28 criterios literales. |
| ¿Criterios de aceptación verificados? | Técnicos locales según fila; faltan nativos/rendimiento visual, aceptación representativa y online. No se reemplazaron ni rebajaron los criterios. |
| ¿Errores importantes conocidos? | Defectos reproducidos de baja/conflicto/error HTTP corregidos y regresados. No se conocen fallos bloqueantes nuevos en las suites ejecutadas; medios por firma, advertencias y zonas sin certificar siguen documentadas. |
| ¿Sesiones correctas? |38 comprobaciones reales HTTP con renovación/revocación/reinicio y pruebas de restore; Chrome/Edge completos pendientes. |
| ¿Segura para el entorno previsto? | Controles locales y avisos revisados, no certificación universal. NVD actualizado y configuración real del destino pendientes; instancia única limita el alcance del rate limiter en memoria. |
| ¿Soporta100 nodos? | Datos, dependencias, autoorganización y cálculos probados. No hay certificación V23 de fluidez visual con gestos prolongados. RNF-4 parcial. |
| ¿Migraciones conservan datos? | Ruta exacta V19/V21 a V23 y repetición, respaldo previo/restore, legado Unicode y NULL conservados. Base personal intacta. |
| ¿Qué requiere humanos/infraestructura? | Herramientas nativas autorizadas operativas; entorno HTTPS autorizado; usuarios reales y aceptación; servicio NVD accesible/clave propia. No se publicó ni contrató servicio. |

## Niveles de evidencia

Implementado: código y esquema presentes. Prueba técnica: ejecución identificada y resultado real por suite/fila. Aceptación: requiere decisión real del usuario/equipo, salvo la regla temporal ya confirmada. Producción: exige infraestructura y operación autorizadas, aún pendientes. Ninguno se deduce automáticamente del anterior. No se atribuyen contribuciones individuales sin evidencia Git.

La actualización Word conserva portada, estructura y propiedades de formato; su QA se documenta después del render. La entrega incluye completo/delta desde V22/JAR/helper y tres SQL/documentos/evidencias, con CRC y SHA256 de todas las copias. Consultar PENDIENTES antes de plantear cierre total.
