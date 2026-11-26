# Informe funcional de TimeFlow V0.5.22-SNAPSHOT

16 de noviembre de 2026, America/Santiago. Continuación directa del proyecto completo V0.5.21; sus fuentes y doce artefactos se contrastaron con SHA-256 antes de modificar código. No hubo discrepancias en las copias actuales, incluido LEEME. Se implementaron y verificaron primero US-03 y después US-06. El Sprint 6 permanece abierto para certificación final, sin iniciar otro sprint ni atribuir aportes individuales en una copia sin Git.

## Presencia basada en jornadas reales

GET /api/jornadas/presencia obtiene, en una consulta, usuarios visibles y EXISTS de jornada sin salida. Una sesión web no abre una jornada; cuenta activa no equivale a presencia. Verde significa jornada abierta y rojo ausencia de jornada abierta. Las cuentas desactivadas no aparecen como presentes; sus registros no se cierran ni alteran artificialmente. Tras reactivar, la jornada real retenida debe cerrarse mediante Check-out. Sin conexión o datos válidos, la interfaz usa gris y texto de indisponibilidad, sin inventar rojo/verde.

El mapa y el panel compacto consultan cada 5 segundos, sin solapamiento, con aborto al desmontar/cambiar de identidad, límite de espera y reintento. Se corrigió una primera implementación que omitía consultas en pestañas de fondo. Los navegadores pueden limitar sus temporizadores: no se promete actualización instantánea. Dos cambios reales llegaron al observador sin F5 en 3782 ms al entrar y 1304 ms al salir, desde la confirmación HTTP hasta la recepción del cliente. El instrumento temporal se retiró. La medición separa el tiempo de las herramientas del sondeo real.

63 comprobaciones HTTP/MySQL cubren login sin jornada, duplicados, dos trabajadores distintos, dos sesiones simultáneas 201/409 y 200/409, baja/reactivación, histórico cerrado, reinicio backend y privacidad. IAB comprobó administrador observador y trabajador con cookies independientes por hostname, recarga y cambios automáticos. No son dos perfiles nativos Chrome/Edge.

## Cronómetros independientes y persistentes

Se añadieron únicamente tiempo_acumulado_ms y tiempo_inicio_ms, BIGINT NULL. Una nueva tarea validada recibe acumulado cero y el inicio del servidor. Los campos son de solo lectura para JSON: POST/PUT no aceptan relojes del cliente como autoridad. Cada tarea conserva su propio acumulado/ancla en MySQL, dentro de las transacciones y bloqueos/versiones ya existentes.

Reglas operativas:

- Acumula mientras la tarea está activa y En Progreso. Notas, metas, posiciones y crear otra tarea no reinician el segmento.
- En Revisión detiene y consolida el segmento. El tiempo de espera de aprobación no se cuenta.
- Rechazar a En Progreso conserva lo acumulado y abre un segmento nuevo; sigue exigiendo motivo y versión vigente.
- Finalizada queda detenida. Su contenido, notas y evidencias no se pueden editar por responsable ni administrador. Mover su nodo por un administrador sigue siendo una operación de organización del mapa, no una edición del contenido aprobado.
- Desactivar la tarea pausa; reactivar solo reanuda una tarea conocida en En Progreso. No se cuenta el intervalo de baja.
- Check-out no cambia el estado de las tareas. Por tanto, no detiene una tarea que continúa En Progreso. Este reloj mide tiempo operativo por estado, no horas trabajadas de una jornada. Ambos conceptos se muestran por separado.
- Las tareas anteriores sin información temporal suficiente conservan ambos NULL y muestran Tiempo no registrado, incluso si cambian de estado. No se interpreta una hora HH:mm como una duración histórica verificable.

GET /api/tareas/sincronizacion devuelve metadatos ligeros, hora del servidor y la jornada del propio usuario. Omite evidencias, notas y descripciones. Tiempos y marcador de notas solo se incluyen para propietario o administrador; se conserva la compatibilidad inequívoca de nombres históricos. El índice (tarea_id,id) permite detectar nuevos registros con MAX(id), sin descargar sus textos.

El cliente calibra una ancla con serverNowMs y medio RTT, y calcula con performance.now monotónico. Cambiar Date.now hacia adelante/atrás no altera las duraciones en las pruebas. La incertidumbre de la ancla es medio RTT; se presupone un reloj de servidor correcto. No se cambió el reloj del sistema operativo. Un único intervalo compartido actualiza los textos cada segundo: no hay un contador por tarjeta que se pierda con F5 ni se renderiza toda la aplicación en cada tick.

81 comprobaciones HTTP/MySQL por etapa y 64 del script público final verifican aislamiento, cambios de estado, notas, edición con tiempos falsificados, permisos y conflictos. El arnés adicional reinició realmente el backend y contrastó anclas/acumulados. IAB mostró tres tarjetas con inicios distintos; F5, Chat, Monitoreo, otra pestaña y reinicio real de Vite conservaron los tiempos. Dos clientes mostraron una diferencia máxima observada de un segundo. B se detuvo en 00:00:50 mientras A y C continuaron; no se reinició al finalizar.

## Actualización automática y correcciones

La consulta ligera cada 5 s detecta altas, bajas y cambios de versión para recargar tareas completas solo cuando es necesario. No descarga las evidencias de 60 MiB en cada intervalo. Los marcadores de registros actualizan las notas paginadas preservando borradores. Las respuestas antiguas se descartan si cambió la sesión o hubo una escritura local posterior. La jornada no se reabre con una instantánea anterior de una salida ya conocida. El mapa conserva el nodo que se está arrastrando o guardando.

Una aprobación remota ahora bloquea las acciones del detalle abierto y actualiza su estado visible, conservando la base/versiones del borrador. La hora de cierre visible toma el dato sincronizado; un cierre antiguo desconocido se identifica como tal. Responsable y administrador no mostraron Guardar, Desactivar ni Aprobar en una tarea finalizada. El backend devolvió 403 para edición, baja, notas y subida de evidencia por ambos roles.

La revisión visual encontró que el modal desplazable recortaba la imagen ampliada. Se corrigió con un portal a document.body, conservando las animaciones originales. PNG/JPG se decodificaron a 343×361 y mostraron vista previa; el visor ampliado final ocupó el viewport de 1265×720 y Escape lo cerró. La captura anterior defectuosa y la final se conservan.

## Mapa, métricas y confirmaciones

Se crearon cien tareas nuevas con 90 enlaces, estados y metas contrastados. La autoorganización Node y el guardado HTTP conservaron todos sus relojes y posiciones. En IAB se montaron simultáneamente los cien nodos y se vieron total/revisión/aprobadas/metas 100/33/33/33. Una modificación desde otro cliente cambió automáticamente a 100/34/33/34 sin F5.

Se comprobó rueda real 0,160156 a 0,24 de zoom, pan de 100×60 píxeles con desplazamiento exacto 100×60, pantalla completa y Escape. Dos muestras rAF de 30 s registraron 46,30 y 40,46 cuadros/s, p95 27,8/27,9 ms y 21/33 intervalos mayores de 50 ms. La segunda incluyó seis ciclos, doce arrastres y doce gestos de rueda en un lote de 9,14 s. rAF mide disponibilidad de cuadros, no rasterización ni latencia individual. Sin comparación contra menos nodos ni carga prolongada no se declara RNF-4 aprobado integralmente.

La autoorganización en navegador mostró una vista previa de 397 tareas sintéticas. Cancelar no alteró ninguna posición en MySQL; Aplicar guardó 383 posiciones modificadas. El filtro limita el subconjunto visible y sus contadores; Autoorganizar trabaja sobre el conjunto completo y está deshabilitado mientras hay filtro.

Cancelar la desactivación de tarea conservó activo, versión y datos. La confirmación nativa de archivo agotó el tiempo de la herramienta y el JPG sintético terminó desactivado; no se confirmó Cancelar. No se cuenta como aprobación de US-20. Se verificó que el archivo permanece guardado lógicamente en MySQL y se cargó otro JPG sintético para repetir la vista previa. IAB se recuperó y permitió continuar; no se pidió al usuario una prueba manual.

## Regresión, migraciones y límites

102 Node y 160 JUnit/MockMvc, sin omisiones; Vite y Maven clean verify aprobados. Se repitieron 152 comprobaciones generales HTTP/MySQL, 49 funcionales anteriores, sesiones/revocación/CSRF/CORS, conflictos, chat/anuncios, cuotas y archivos de 60 MiB. Postman: 32 solicitudes y 40 aserciones, incluidas presencia y sincronización. Los conjuntos se solapan y no se deben sumar como casos independientes.

Se mantuvieron las dos migraciones V0.5.21 y se añadió la de tiempos V0.5.22. Se probaron esquemas exactos entregados V0.5.19 y V0.5.21, instalación limpia y ejecuciones repetidas. El helper V0522 respalda antes del primer DDL; su respaldo V19 se restauró y actualizó sin pérdida. Once comprobaciones de esquema/respaldo, sin login HTTP del esquema restaurado ni simulación de corte abrupto. La base personal no fue consultada ni modificada; solo instancia 33316 y esquemas sintéticos.

No se añadieron dependencias de producción. npm audit del lock actual no reporta alertas; no demuestra ausencia de vulnerabilidades. NVD/backend actualizado, producción online, pruebas prolongadas, usabilidad con usuarios, todos los diálogos y certificación Chrome/Edge nativos siguen pendientes. Las pruebas previas TLS/PDF/medios se conservan como antecedentes cuando no se repitió su apertura nativa.

El backlog Word conserva portada, estilos, márgenes, tablas y numeración. Se verificaron ocho páginas y se corrigió la referencia del índice de Evidencias a la página 8. Las matrices contienen literalmente los 28 criterios originales; sus estados y evidencias distinguen lo nuevo, lo heredado y lo parcial. Ver RESULTADOS, TRAZABILIDAD y PENDIENTES antes de proponer un cierre.
