# Informe funcional de TimeFlow V0.5.21-SNAPSHOT

15 de noviembre de 2026, America/Santiago. Continuación directa de V0.5.20, sin reconstrucción. La copia no contiene Git: la entrega se compara por SHA-256 con el ZIP V0.5.20 conservado. Se implementan las prioridades US-07, US-10 y US-19 y se completan técnicamente US-02, US-04 y US-05 en el entorno local documentado. El Sprint 6 permanece abierto; no es una versión estable ni aceptación académica global.

## US-07 Notas con autor y fecha

`POST /api/tareas/{id}/registros` recibe solamente contenido, de 1 a 10000 caracteres no blancos. Autor, nombre histórico, tarea, tipo y fecha en milisegundos los asigna el servidor. Cada nota se inserta por separado; no se reemplaza una colección enviada por el navegador. El bloqueo de la tarea serializa el agregado con revisión, cierre y baja. Se admiten dos agregados simultáneos sin perder ninguno. Solo responsable o administrador pueden leer y agregar; en revisión/finalizada no se agregan notas.

La tabla `tarea_registros` mantiene contenido, autor y fecha; no hay endpoints para modificar o borrar entradas. `GET /api/tareas/{id}/registros?tipo=NOTA&page=0&size=20` devuelve registros ordenados por fecha/ID y paginados en servidor, con máximo 100 por página. La UI los muestra en la tarjeta y el detalle, y conserva el borrador ante error.

La migración deja intacta la columna antigua `bitacora`. Se muestra por separado como texto anterior sin fechas individuales. Las nuevas notas iniciales reciben fecha y autor reales al crear la tarea. Para compatibilidad, un cliente antiguo que modifica la columna con PUT archiva el texto sustituido como LEGADO sin inventar fecha/autor, y registra la nueva entrada con los metadatos reales. Pueden verse el texto base y sus instantáneas históricas: no se deben deduplicar eliminando contenido sin revisión.

La UI actual agrega notas y trata la columna anterior como solo lectura. Al revisar un conflicto se toma ese texto de la versión reciente, preservando los campos realmente editados, para no revertir una bitácora remota desde un campo que el usuario no modificó.

Verificación por etapa: 26 comprobaciones HTTP/MySQL, 7 pruebas Java nuevas y dos Node; nota real agregada en IAB con autor/fecha visibles. La suite final vuelve a probar notas paralelas, permisos, revisión y bloqueo de finalizadas. Las bitácoras/versiones existentes se compararon antes/después de aplicar la migración dos veces.

## US-10 Rechazos con motivo e historial

Una devolución de En Revisión a En Progreso exige administrador, versión vigente y `motivoRechazo` de 1 a 3000 caracteres no blancos. Un motivo inválido produce 400 sin cambiar el estado ni insertar historial; un borrador obsoleto produce 409. La devolución y su registro RECHAZO se confirman dentro de la misma transacción. No se aceptan metadatos de autor o fecha del cliente.

Cada devolución conserva su propio motivo, autor y fecha. El responsable consulta `GET /api/tareas/{id}/registros?tipo=RECHAZO`; otros trabajadores reciben 403. El formulario deshabilita Devolver sin motivo, conserva el texto ante conflicto y permite revisar valores recientes. Aprobar/devolver usa la versión y la base completa que el modal muestra, evitando mezclar una versión revisada con campos de un listado viejo.

Verificación: 25 comprobaciones exportadas por etapa; dos administradores reales HTTP desde la misma versión obtienen 200/409, solo un rechazo se registra, una segunda devolución conserva ambos motivos. El propietario puede leerlos y un ajeno no. En IAB se probó botón vacío bloqueado, motivo válido y visualización de tres devoluciones. El log imprime un caso adicional de lectura de contexto después de exportar el JSON: no se suma al total registrado de 25.

## US-19 Historial de finalizadas

Nueva sección Historial de tareas para ambos roles. `GET /api/tareas/historial` acepta page (0 a 100000), size (1 a 100), query (hasta 180 caracteres), desde/hasta opcionales en yyyy-MM-dd. El rango es por cierre UTC, con día Hasta completo incluido. Orden estable: fecha de finalización descendente e ID descendente; las fechas desconocidas quedan al final.

El servidor aplica estado Finalizada, activo, permisos, búsqueda y fechas antes de LIMIT/OFFSET. Devuelve proyección pequeña: ID, código, nombre, responsable, estado, fecha de creación y cierre; no selecciona bitácoras, evidencia ni colecciones. El conteo va en una consulta separada. La búsqueda usa parámetros y escapa los comodines literales. No se filtra ni pagina una descarga completa dentro de HistoryView.

El administrador ve las tareas visibles finalizadas y cada trabajador solo las suyas, con compatibilidad de nombres antiguos únicamente cuando su identidad es inequívoca. Los detalles se cargan bajo demanda con `GET /api/tareas/{id}` y vuelven a verificar permisos. Una respuesta pendiente de otra sesión no puede abrir un modal bajo una identidad nueva. Las tareas finalizadas conservan el bloqueo de edición y archivos.

`finalizada_en_ms` registra el cierre real del servidor desde V0.5.21. Los valores de cierre enviados por el cliente no determinan ese timestamp. Los cierres anteriores sin fuente fiable se mantienen NULL, aparecen como Fecha no registrada y se excluyen al filtrar por rango. No se convierte una fecha de creación o una hora suelta en fecha de cierre ficticia.

67 comprobaciones por etapa: páginas 5+5+1 de 11 tareas propias, administrador con 13, otro trabajador con dos, páginas sin duplicados, detalle 403 para ajeno, límites de tamaño, fechas inclusivas, parámetros inválidos, consulta maliciosa literal y EXPLAIN conservado. Dos fechas se ajustaron explícitamente solo en fixtures sintéticos para probar rango y NULL. IAB verificó búsqueda, dos páginas, fecha desconocida, rango de una tarea, propietario/ajeno y detalle de solo lectura.

La aplicación conserva la carga general heredada del mapa al iniciar. La paginación del historial no solicita ese listado al cambiar páginas o filtros. Desacoplar completamente la carga inicial del mapa y medir volúmenes grandes queda como mejora de escalabilidad, sin cambiar aquí Monitoreo Espacial ni sus dependencias.

## Criterios adicionales

- US-04: nombre, meta y hora límite obligatorios en creación, tanto UI como backend; se eliminan sustitutos automáticos de meta y fecha. Validación de horas/fechas conservada; inicia En Progreso. Las tareas anteriores pueden seguir editándose sin exigirles retroactivamente campos faltantes. Fixtures anteriores de pruebas se completaron con campos válidos para seguir comprobando ciclos, permisos y jornada; no se eliminaron pruebas.
- US-05: selección de plantilla activa completa descripción y un campo visible de título de solo lectura. Cambio A/B y creación desde B comprobados; plantilla inactiva excluida. No se renombraron tareas antiguas al cambiar plantillas.
- US-02: advertencia dentro de la interfaz antes de salir con tareas sin finalizar; cancelar no cierra, confirmar sí. La salida se deshabilita mientras no se conocen las tareas, para no omitir la advertencia con el listado inicial vacío. Duración mostrada con horas, minutos y segundos del servidor. Caso real: 29 s, contrastado con ambos timestamps MySQL. Un diálogo nativo del arnés bloqueó la interacción inicial; se sustituyó por confirmación DOM y se repitió el flujo completo en una pestaña visible. El intento bloqueado no se cuenta como aprobación.

## Compatibilidad y base de datos

Se conservan renovación HttpOnly y F5, revocación MySQL, CSRF/CORS, JWT, BCrypt, versiones/409, dependencias múltiples, guardado de posiciones/autoorganización, archivos y PDF protegido, confirmaciones de baja y permisos. El PDF heredado de V0.5.20 se mostró con el código final. La regresión repitió límites 60 MiB por archivo, 300 MiB por tarea y 25 archivos en MySQL sintético, no en la base personal.

Dos migraciones aditivas: registros y fecha/índices de historial. Ambas se ejecutaron dos veces, preservando datos. Además se probó el esquema limpio completo repetido y una actualización desde el esquema exacto incluido en el ZIP V0.5.20, con legado Unicode y fechas desconocidas intactos. Se respaldaron/restauraron dos tareas sintéticas con notas/rechazos en esquemas nuevos del puerto 33316; solo SQL, sin ampliar permisos ni probar login de la aplicación en el esquema restaurado.

La revisión automática rechazó una propuesta de edición por truncamiento del archivo de esquema. No se ejecutó; se sustituyó por una modificación puntual de la tabla nueva, luego verificada. No se solicitaron pruebas manuales al usuario, no se modificó MySQL personal y no se distribuyen dumps ni secretos.

## Alcance de la validación

Compilación limpia y JAR arrancado con MySQL; 93 Node, 148 JUnit/MockMvc, 152 HTTP generales, 49 funcionales finales, 32 aserciones Newman y pruebas adicionales de sesiones/concurrencia. Los resultados se solapan: no sumarlos como un único número de pruebas independientes. RESULTADOS identifica logs/JSON por etapa y final.

Frontend sin nuevas dependencias respecto a V0.5.20. npm audit final no reportó alertas para el lock actual; esto no demuestra ausencia de vulnerabilidades. La auditoría backend/NVD/HTTPS local de V0.5.20 permanece como antecedente; no se presenta como una ejecución nueva ni como certificación de producción. NVD actualizado y operación distribuida siguen pendientes.

US-03 (presencia real por jornada) y cronómetros de US-06 no se implementaron en esta entrega. Se mantienen los criterios parciales restantes, Chrome/Edge completos, dos perfiles UI independientes, carga prolongada y aceptación académica como pendientes. No se atribuye trabajo individual sin historial verificable.
