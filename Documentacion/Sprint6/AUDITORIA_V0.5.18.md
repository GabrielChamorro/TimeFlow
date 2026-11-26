# Auditoría de TimeFlow V0.5.18-SNAPSHOT

Fecha de ejecución: 14 de noviembre de 2026, America/Santiago. Base recibida: V0.5.17-SNAPSHOT. Sprint 6 permanece **abierto**. Se entrega una candidata para pruebas controladas; no se certifica producción ni el cierre de US-01 a US-23 y RNF-1 a RNF-5.

## Alcance y trazabilidad

Se inspeccionaron estructura, 37 fuentes Java originales, frontend, pruebas, configuración, SQL, instaladores, backlog Word y registro del Sprint 6. El paquete original contenía 263 archivos de distribución, sin Git ni AGENTS.md. Se conservaron un ZIP original y sus SHA-256 en `.audit`, fuera del código distribuido. `ARCHIVOS_CAMBIADOS.json` identifica las diferencias de la entrega. Las evidencias históricas permanecen identificadas como Sprint 5 o versiones anteriores.

El backlog principal enumera áreas funcionales, pero **no proporciona las definiciones individuales ni los criterios de aceptación de US-01…US-23 o RNF-1…RNF-5**. Tampoco se encontraron esas definiciones en los documentos Word del Sprint 5. La matriz adjunta mantiene esos 28 identificadores pendientes de trazabilidad; no se inventa su correspondencia con funciones observadas.

## Estado inicial ejecutado

- `npm ci`: falló inicialmente por ENOTFOUND dentro del aislamiento. Con acceso de red se instalaron 51 paquetes del lockfile.
- Node: 74/74 aprobadas. Build Vite: aprobado. Lint: 0 errores y 17 advertencias.
- `mvnw.cmd clean verify`: 89 pruebas, 1 fallo, 0 omitidas. Un mock de movimiento preparaba `findById`, pero el endpoint empleaba `findByIdForUpdate`. La compilación no alcanzó un JAR aprobado.
- OWASP 13.0.0: análisis local ejecutado, con NVD actualizado por última vez el 25 de octubre; no se confunde con un análisis actual completo.
- No había colecciones Postman JSON en la entrega: había capturas y reportes del Sprint 5. Se creó y ejecutó una colección del Sprint 6.

`Evidencias/Sprint6/V0.5.18/ESTADO_INICIAL.md`, `junit-inicial.zip`, los logs iniciales y las pruebas de reproducción conservan ese estado.

## Hallazgos confirmados y correcciones

La gravedad siguiente es una evaluación contextual, no una puntuación CVSS ni un CVE asignado.

| ID | Gravedad | Reproducción y efecto | Corrección y evidencia |
| --- | --- | --- | --- |
| S6-18-01 | Media, integridad | Dos subidas cuando había 24 archivos devolvieron 201/201 y dejaron **26**. La consulta de usuario iniciaba una instantánea REPEATABLE_READ anterior a la espera del bloqueo de tarea. | `subir` usa READ_COMMITTED además del bloqueo existente. Repetición: 201/400, **25** archivos. `cuota-concurrencia-antes.json`, `cuota-concurrencia-despues.json`, `concurrencia-final.json`. |
| S6-18-02 | Media, integridad | Editar bitácora y mover el mismo nodo simultáneamente devolvió 200/200, pero el UPDATE de la entidad restauró `posicionX=null`. | Edición, desactivación y reactivación leen la fila con bloqueo dentro de transacción. Repetición conserva posición 555 y bitácora. `edicion-movimiento-antes.json`, `edicion-movimiento-despues.json` y regresión JUnit. |
| S6-18-03 | Media, integridad | El PATCH manual aceptaba una posición original obsoleta y sobrescribía a otro administrador. | Exige `anteriorX`/`anteriorY` explícitos, incluidos null, y compara bajo bloqueo. Devuelve 409 ante conflicto. Frontend envía la posición persistida que vio al iniciar el arrastre. Prueba JUnit y HTTP. |
| S6-18-04 | Media, disponibilidad | Un trabajador no autorizado podía provocar lectura de un LONGBLOB de hasta 60 MiB antes del rechazo por permisos. No se observó entrega del contenido al atacante. | Se autoriza la tarea antes de consultar la evidencia. Regresión verifica 403 y que el repositorio de archivos **no se consulta**. |
| S6-18-05 | Baja, manejo de errores | Una carga de 60 MiB + 1 byte produjo 401 debido al despacho de error multipart dentro de autenticación stateless. | `ApiExceptionHandler` resuelve el exceso como 413 JSON. Repetido con Tomcat y MySQL reales. |
| S6-18-06 | Media, disponibilidad | Al detener MySQL de prueba, un JWT válido recibió 401 porque el filtro confundía el fallo de repositorio con token inválido. | Fallos `DataAccessException` responden 503 sin detalles internos ni autenticación permisiva. MockMvc y reinicio real: 503 durante caída, 200 después, posiciones idénticas. El primer arnés de reinicio requirió corrección de arranque; su log no se presenta como aprobado. |
| S6-18-07 | Baja, validación | Fechas como 2026-02-30 y hora 24:00 se aceptaban por normalización SMART. | Validación ISO estricta y formato explícito; se rechazan con 400 antes de guardar. Dos regresiones JUnit. |
| S6-18-08 | Baja, validación | Una contraseña Unicode podía tener menos de 64 caracteres y exceder los 72 bytes admitidos por BCrypt. | Límite UTF-8 en alta/edición, login y administrador inicial. No se truncan contraseñas. Regresión evita llegar al codificador con un valor excesivo. |
| S6-18-09 | Media, funcionalidad | La distribución inicial limitaba la profundidad a 50, perdiendo la dirección en cadenas mayores. Una cadena inversa de 12.000 nodos agotaba la pila. | Recorrido topológico iterativo, sin tope artificial de profundidad. Ambas reproducciones fallaron antes y pasan después. No constituye una prueba de rendimiento visual con 12.000 tarjetas. |
| S6-18-10 | Prueba incompleta | Un caso MockMvc de movimiento simulaba el método antiguo del repositorio. | Se actualizó el mock y se conservaron las aserciones de éxito y posición. Las pruebas de edición/baja usan también la consulta bloqueada correcta. No se eliminó ni desactivó ninguna prueba. |

Cambios adicionales: URL base configurable mediante `VITE_API_URL`, con valor local compatible y archivo de ejemplo corregido; retirada de una variable sin uso. Se añadió una indicación de descarga para navegadores que no presentan el PDF aislado. No se deshabilitaron controles de seguridad ni se añadió migración MySQL para V0.5.18.

## Pruebas funcionales y límites de lo comprobado

Las rondas HTTP incluyen login, JWT manipulado, permisos administrativos, Check In/Out, creación y modificación de tareas, varias dependencias, ciclos, referencias inactivas, listas privadas, mensajes directos, anuncios, tipos de tarea, desactivación/reactivación y cambio de contraseña con invalidación del JWT previo. Se verificaron respuestas HTTP y lecturas posteriores desde API/MySQL; no se consideró suficiente mostrar una pantalla.

Con MySQL 8.4.13 aislado en 33316 se enviaron cinco archivos reales de **60 MiB** a una tarea; completaron **300 MiB** conservados, incluido uno desactivado. Se rechazó el archivo adicional y también un archivo de 60 MiB + 1 byte. La descarga de 60 MiB conservó SHA-256. Se verificó la cuota de 25 y el rechazo del archivo 26. Son MiB binarios (1.048.576 bytes), aunque la interfaz diga MB. La instancia de prueba tenía `max_allowed_packet=134217728`; no se cambió el servidor existente de 3306.

Se rechazaron ejecutables, PNG de contenido HTML, rutas manipuladas, archivos vacíos y un DOCX comprimido que intentaba expandir 129 MiB. Se probaron PNG, TXT, DOCX y PDF por HTTP. Parte de la ronda inicial utilizó fixtures mínimos de firma/estructura, que no prueban apertura en aplicaciones de escritorio. La prueba adicional subió un DOCX real, un PDF válido y videos sintéticos MP4/WEBM; las descargas coincidieron en SHA-256 y los videos descargados se decodificaron completamente con FFmpeg. En navegador: PNG con dimensiones naturales correctas, MP4 reproduciéndose y WEBM cargado con duración de 2 segundos. Abrir DOCX en Word desde la descarga no quedó verificado.

En el mapa se montaron **100 tareas reales**, con **126 dependencias**; la medición de rectángulos del DOM encontró **0 superposiciones** en la vista previa. Se comprobó vista previa sin escritura, Cancelar sin escritura, Aplicar 100 posiciones, movimiento manual, zoom/encaje, pantalla completa y recarga. Los hashes de posiciones de MySQL antes/durante/cancelación coinciden; cambian tras Aplicar y arrastre. No se midieron FPS ni se demostró una reducción óptima de cruces. El PDF dentro del iframe protegido apareció vacío en el navegador integrado: la descarga válida funciona, y se dejó una indicación alternativa. No se habilitaron scripts en ese iframe.

En administración se observaron las tres confirmaciones de cuenta y las dos de plantilla, bloqueo con correo/nombre incorrectos y desactivación efectiva con conservación. No hay opción de desactivar desde el formulario de edición de cuentas. Las restricciones de trabajador se comprobaron en interfaz y directamente en API; las confirmaciones son una protección de interfaz, no una autorización del backend.

La migración V0.5.8 se ejecutó dos veces sobre una segunda base sintética. Conservó las relaciones antiguas, limpió `dependencia_id` y no reintrodujo un vínculo quitado al ejecutarse una tercera vez. No se ejecutó sobre la base del usuario ni valida todos los posibles datos heredados de producción.

## Auditoría de dependencias y fuentes oficiales

Se mantuvieron las dependencias para conservar compatibilidad; no se atribuyen avisos inexistentes ni se proponen versiones no verificadas. `npm audit` final informa 0 avisos para el lockfile. El árbol Maven efectivo incluye Spring Boot 4.1.2, Spring Security 7.1.2, Spring Data JPA 4.1.2, Tomcat 11.0.27, Connector/J 26.10.0, JJWT 0.12.7 y Gson 2.13.2.

- [Aviso de Vite GHSA-p4f5-76q4-ffq7](https://github.com/vitejs/vite/security/advisories/GHSA-p4f5-76q4-ffq7): Vite 8.2.6 está por encima de la corrección 8.2.5 de esa rama. No se presenta como una vulnerabilidad nueva de esta entrega.
- [Spring CVE-2026-41707](https://spring.io/security/cve-2026-41707/), [CVE-2026-47841](https://spring.io/security/cve-2026-47841/) y [CVE-2026-47877](https://spring.io/security/cve-2026-47877/): las correcciones de esa rama están en 7.1.1 y el proyecto resuelve 7.1.2. Tampoco configura DPoP, WebAuthn ni Authorization Server.
- [Spring Data JPA CVE-2026-47834](https://spring.io/security/cve-2026-47834/): el proyecto resuelve 4.1.2, posterior a 4.1.1; sus consultas nativas no reciben Sort/Pageable del usuario.
- [Seguridad de Tomcat 11](https://tomcat.apache.org/security-11.html): los avisos revisados de octubre afectan hasta 11.0.26; la dependencia efectiva es 11.0.27.
- [Notas oficiales Connector/J 26.10.0](https://dev.mysql.com/doc/relnotes/connector-j/en/news-26-10-0.html): versión publicada y compatible con MySQL 8.4. Se verificó la integración real.
- Se consultaron también las [listas de avisos JJWT](https://github.com/jwtk/jjwt/security/advisories) y [Gson](https://github.com/google/gson/security/advisories). Su consulta no sustituye el barrido transitivo completo.

OWASP se ejecutó nuevamente en la versión final con la caché local: sin hallazgos reportados por esa caché. La actualización real de NVD falló por falta de clave; OSS Index quedó deshabilitado por falta de credenciales. **La cobertura de avisos del backend posteriores al 25 de octubre queda pendiente.** No se añadió ninguna supresión para hacer aprobar el análisis.

## Riesgos y criterios que impiden el cierre

1. Faltan las definiciones originales de las 23 US y 5 RNF y su validación completa trazable.
2. No está completo el análisis actualizado de dependencias transitivas del backend.
3. JWT permanece en localStorage y el cierre de sesión limpia el navegador sin revocar individualmente un token copiado. Una cuenta reactivada con la misma contraseña puede volver a aceptar tokens anteriores aún vigentes. Son riesgos de sesiones pendientes de rediseño persistente y pruebas; no se afirma revocación por logout.
4. El limitador de login es local en memoria: se reinicia con el backend y no coordina múltiples instancias. Las firmas de archivos y el límite ZIP no sustituyen antivirus, desarme de documentos ni un parser completo de todos los formatos.
5. Queda pendiente cubrir conflictos entre dos ediciones del mismo campo de una tarea/usuario/plantilla: los bloqueos incorporados evitan la pérdida cruzada de posiciones y protegen el grafo, pero no ofrecen versionado optimista de todos los formularios.
6. No se certifican restauración de un respaldo de producción, recuperación ante corte eléctrico, pérdida de respuesta después de COMMIT, carga prolongada, varios servidores, todos los navegadores o accesibilidad completa. La restauración visual de PDF en el navegador integrado quedó pendiente.
7. Persisten advertencias de lint y avisos de Mockito/agentes de pruebas; se registran sin desactivar reglas ni pruebas. La revisión visual con 100 nodos no equivale a un benchmark de FPS.

No se identificó una vulnerabilidad crítica o alta confirmada dentro del alcance ejecutado. La falta de hallazgos no garantiza seguridad absoluta ni permite cerrar Sprint 6 con los puntos anteriores pendientes.
