# TimeFlow - Registro de avance del Sprint 6

**Fecha de corte:** 16 de noviembre de 2026.  
**Planificación:** 9 al 22 de noviembre de 2026.  
**Estado:** En desarrollo.  
**Última versión de código preparada:** V0.5.22-SNAPSHOT (candidata con verificación parcial; Sprint abierto).

El Sprint 6 mantiene la preparación de una versión candidata, con un alcance ampliado durante el desarrollo. No deben atribuirse estos cambios al Sprint 5, cuyo cierre corresponde a V0.5.3.

## Evolución del Sprint 6

- **V0.5.4:** dependencias opcionales entre tareas, conexiones del mapa y galería de evidencias.
- **V0.5.5:** desactivación lógica de tareas, usuarios, plantillas y evidencias.
- **V0.5.6:** auditoría de seguridad y correcciones de permisos.
- **V0.5.7:** subida de archivos de hasta 60 MB; límites de cantidad y tamaño total por tarea.
- **V0.5.8:** dependencias múltiples, migración a la tabla `tarea_dependencias` y flechas individuales. La migración V0.5.8 debe aplicarse antes del uso de esta funcionalidad.
- **V0.5.9:** corrección de pantalla blanca en Monitoreo Espacial al cargar dependencias reales. El usuario confirmó que volvió a funcionar.
- **V0.5.10:** revisión de sesiones, intentos de acceso, datos mostrados en el directorio de usuarios y recuperación de errores.
- **V0.5.11:** mejoras de Gestión de usuarios y Tipos de tareas, filtros, mensajes de error y reactivación administrativa.
- **V0.5.12:** microinteracciones en botones, diálogos, pestañas y formularios; pruebas preventivas de importaciones.
- **V0.5.13:** actualización de Vite y controles adicionales en inicio de sesión, DOCX y vista previa PDF.
- **V0.5.14:** límite de tamaño para solicitudes JSON, protección de cambios simultáneos en dependencias y configuración local del backend.
- **V0.5.15:** confirmación de desactivación en tres pasos para usuarios y dos pasos para tipos de tarea.
- **V0.5.16:** autoorganización del mapa por dependencias y fecha límite, vista previa reversible y guardado conjunto de posiciones.
- **V0.5.17:** correcciones del arrastre manual, prevención de guardados simultáneos, mayor separación de tarjetas y validación de posiciones.
- **V0.5.18:** auditoría ejecutada, correcciones de cuotas y edición concurrente, posiciones obsoletas, validación y recuperación de MySQL; verificaciones e integración documentadas sin cierre del sprint.

## Pruebas registradas

- En V0.5.17: **74/74 pruebas Node aprobadas**.
- En la revisión de V0.5.17 se verificaron **25 archivos JS/JSX** y **36 importaciones relativas**, sin errores señalados.
- En V0.5.18: **76/76 Node, 100/100 JUnit/MockMvc**, compilaciones de frontend/backend correctas y JAR verificado.
- En V0.5.18 se ejecutaron **151 comprobaciones HTTP/MySQL y 32 aserciones Newman**, operaciones simultáneas, cuotas reales de archivos y autoorganización con 100 tareas. Ver resultados y límites en los documentos de esta versión.
- No debe confundirse una prueba de código con una certificación funcional o de seguridad de la versión completa.

## Criterios pendientes para el cierre

1. Obtener las definiciones y criterios individuales de US-01…US-23 y RNF-1…RNF-5 y completar su trazabilidad.
2. Completar NVD actualizado del backend; la caché examinada es del 25 de octubre y la actualización falló por falta de clave.
3. Resolver revocación persistente de sesiones, riesgos de localStorage y despliegue de varias instancias.
4. Completar visores de documentos, pruebas de todos los navegadores y la revisión de accesibilidad.
5. Probar versionado de formularios, carga prolongada, respuesta perdida tras COMMIT y restauración de respaldos reales.
6. Repetir los casos afectados y registrar una versión estable únicamente después de verificar los criterios pendientes.

Este registro resume versiones de código y resultados de pruebas disponibles. Las responsabilidades del equipo son **previstas** según el Sprint Backlog original y no prueban aportes personales sin revisar Git.

Documento Word principal: `Documentacion/Sprint6/TimeFlow_Sprint_Backlog_6_Actualizado.docx`.

## Auditoría y estabilización V0.5.18 del 14 de noviembre

Se trabajó sobre el código recibido V0.5.17, conservando funciones y antecedentes del Sprint 5. Se registró el estado inicial antes de corregir fuentes: 74 Node aprobadas; Maven ejecutó 89 pruebas con un fallo de mock. No se encontró Git; se conservaron hashes y respaldo original local.

V0.5.18 corrige cuotas concurrentes de evidencias, pérdida cruzada de posiciones al editar, movimientos manuales obsoletos, lectura de archivos antes de autorizar, fechas/horas inválidas, tamaño UTF-8 de contraseñas BCrypt, profundidad/recursión del mapa y respuestas erróneas 401 por multipart o caída de MySQL. No requiere nueva migración de esquema.

Verificación final ejecutada: **76/76 Node, build Vite correcto, 100/100 JUnit/MockMvc y JAR compilado, 151/151 comprobaciones HTTP/MySQL y 32/32 aserciones Newman**. Se repitieron las carreras de cuota y edición/posición. Se comprobó recuperación de MySQL con 503 durante la caída y 200 después. Se probaron 60 MiB, 300 MiB conservados y 25 archivos, además de subida interrumpida y límite de login real.

En navegador se verificaron 100 tareas y 126 dependencias sin superposición medida, vista previa y Cancelar sin escritura, Aplicar, arrastre, recarga, confirmaciones de 3/2 pasos y permisos del trabajador. MP4 y WEBM válidos; PNG visible. El PDF aislado apareció vacío en el navegador integrado y requiere descarga alternativa. El backlog Word conserva ocho páginas, portada y propiedades de estilo; se ajustó una página del índice y se verificó la exportación nativa de Word.

`npm audit` final reporta 0 avisos. OWASP con caché se ejecutó, pero NVD permanece fechado al 25 de octubre y la actualización falló por falta de clave; no certifica avisos posteriores. Los documentos entregados no incluyen definiciones individuales de US-01…US-23/RNF-1…RNF-5. Permanecen riesgos de sesiones, visores y conflictos generales: **no se declara cierre**. Ver AUDITORIA_V0.5.18.md, RESULTADOS_V0.5.18.md, MATRIZ_ACEPTACION_V0.5.18.md y las evidencias de esta versión.


## V0.5.19-SNAPSHOT — continuación y sesiones persistentes

15 de noviembre de 2026. Se conservaron las correcciones interrumpidas; se terminó la renovación HttpOnly con rotación, CSRF/Origin, CORS acotado y revocación MySQL. F5 restaura usuario/rol. Se comprobó cerrar/reabrir pestaña; queda pendiente reiniciar el proceso completo del navegador. JWT en memoria, sin almacenamiento persistente legible por JavaScript.

@Version y revisión explícita de conflictos en tareas, usuarios y tipos; borradores conservados y bajas concurrentes rechazadas. Cinco migraciones aditivas e idempotentes con respaldo requerido. No se modificó la base personal del usuario.

Verificación final: 84 Node, 124 JUnit, 152 HTTP/MySQL, 32 aserciones Newman, 38 comprobaciones de renovación, 20 de cuentas y 18 de tipos. Build de ambas partes aprobado. NVD actual, criterios US/RNF, HTTPS real y otros límites mantienen el Sprint abierto. Las secciones V0.5.18 anteriores son históricas.


## V0.5.20-SNAPSHOT

15/11/2026: PDF protegido visible en canvas; reserva atómica antes de BCrypt, limpieza programada y correcciones seguras de lint. 86 Node, 127 JUnit, 152 HTTP/MySQL, 32 Newman, 38 sesiones y conflictos de tareas/cuentas/tipos ejecutados nuevamente. HTTPS directo, restore SQL sintético y reinicio MySQL comprobados. Word actualizado preservando formato, revisado en ocho páginas. Criterios US/RNF originales recuperados: matriz con brechas explícitas. Sprint abierto por aceptación parcial, NVD actual y pruebas esenciales Chrome/Edge/dos perfiles UI pendientes. No se atribuyen aportes individuales.


## V0.5.21-SNAPSHOT — funcionalidades prioritarias

15/11/2026. US-07 notas con autor/fecha y agregado concurrente; US-10 motivo obligatorio e historial; US-19 historial SQL paginado con búsqueda/rango UTC/detalle privado. Legado preservado sin fechas inventadas. También US-02 advertencia/cancelación/duración exacta, US-04 campos obligatorios y US-05 autocompletado visible de plantilla activa. US-03 y cronómetros US-06 permanecen pendientes.

93 Node, 148 JUnit/MockMvc, 152 HTTP generales, 49 funcionales finales y 32 Newman aprobados, además de sesiones y conflictos. Dos migraciones repetidas desde V0.5.20, esquema limpio y restore sintético de notas/rechazos comprobados. Word conservado y revisado en ocho páginas; matriz literal actualizada. Sprint abierto y sin atribuciones individuales sin historial. Resultados anteriores conservados como antecedentes.

## Continuación V0.5.22 del 16 de noviembre de 2026

Base V0.5.21 contrastada íntegramente antes de editar. US-03 implementada y verificada primero; US-06 después. Presencia real por jornadas, cronómetros persistentes y sincronización ligera, con tres tarjetas/dos clientes/F5/reinicios. Imágenes, bloqueo y roles ampliaron su verificación local. Rueda, pan 1:1, Escape, 100 nodos, métricas sin F5 y autoorganización comprobados en IAB; rendimiento prolongado sigue parcial.

102 Node, 160 JUnit/MockMvc, 152 HTTP generales, 49 funcionales repetidas, 64 V22 y 40 Newman; no sumar conjuntos solapados. Migración directa desde V19 con respaldo previo y tres SQL. Word de ocho páginas con formato preservado e índice actualizado. Sprint abierto para la certificación descrita en PENDIENTES_V0.5.22.md. No se atribuyen aportes individuales sin historial verificable.
