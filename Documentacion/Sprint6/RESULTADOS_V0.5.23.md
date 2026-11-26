# Resultados nuevos de TimeFlow V0.5.23

16 de noviembre de 2026. Ensayo local aislado; los conjuntos se solapan y NO se suman como pruebas independientes. Los resultados visuales V22 son antecedentes identificados por versión. Ninguna limitación de herramienta se convierte en aprobación.

| Suite nueva | Resultado | Evidencia V23 |
|---|---|---|
| Node completo | 106/106, cero omitidas | resumen-pruebas.json |
| JUnit/MockMvc, cadena de seguridad incluida | 169/169, cero fallos/errores/omitidas | jar-integridad.json |
| Maven clean verify | Aprobado, Temurin21.0.13+9 portable | jar-integridad.json; seguridad-dependencias.json |
| Vite build | Aprobado, configuración de distribución localhost:8080 | resumen-pruebas.json |
| Lint | Cero errores, nueve advertencias; reglas conservadas | calidad-codigo.md |
| Newman | 32 solicitudes,40 aserciones, cero fallos | postman-newman.json |
| HTTP/MySQL general (incluye límites de archivos) | 152/152 | integracion-mysql-final.json |
| Funcionalidades anteriores repetidas | 49/49 | funcionalidades-final.json |
| Cronómetros, script público | 64/64 | cronometros-publica-final.json |
| Sesiones, CSRF, rotación y reinicio real | 38/38 | renovacion-mysql.json |
| Cuentas y conflictos | 20/20 | usuarios-mysql.json |
| Tipos y conflictos | 18/18 | tipos-mysql.json |
| Tareas y conflictos | 27/27 | tareas-mysql.json |
| Carreras de MySQL | 2/2 | concurrencia-final.json |
| Presencia por jornada | 63/63 | presencia-mysql.json |
| Cronómetros por etapa, reinicio y legado NULL | 81/81 | cronometros-mysql.json |
| Bajas condicionales y permisos HTTP | 41/41 | confirmaciones-http.json |
| Comparaciones MySQL antes/después de UI | 17/17 | confirmaciones-mysql-ui.json |
| Esquema/helper desde V19/V21 | 11/11 | migraciones-y-respaldo.json |
| Corpus controlado, permisos y descargas | 57/57 | corpus-archivos.json |
| Respaldo completo y recuperación operativa | 23/23 | restauracion-completa-operativa.json |
| Sondeo y reconexión HTTP | 15/15 | sincronizacion-y-carga-http.json |
| 100 tareas nuevas/294 vínculos, API y algoritmo | 212/212 | mapa100-http.json |

## Alcance visual nuevo

IAB Chromium: Cancelar/X/Escape en bajas de archivos y tareas, administrador y responsable; cuentas de tres pasos y tipos de dos, texto incorrecto bloqueado, confirmación final única. Diecisiete comparaciones MySQL de filas/versión/relojes y SHA256 de BLOB, sin alterar otros registros. Conflicto de baja de tarea visible con borrador conservado; revisar/adoptar base reciente sin perderlo. El fallo V22 del diálogo nativo no demostraba que Cancelar hubiera sido ejecutado; se reemplazó window.confirm por un componente React con acción explícita y rutas de cancelación sin DELETE. No se atribuye sin prueba un fallo lógico al Cancelar anterior.

Chrome instalado, perfil desechable y login observados. Al solicitar F5, Computer Use se detuvo porque no pudo determinar la URL actual en Windows con suficiente confianza para aplicar su política. Se cerró esa fase y no se usaron otras vías para controlar/instrumentar navegadores. No se certifican F5, cierre/reapertura, cookies bloqueadas/eliminadas, Edge ni dos perfiles nativos independientes. Los dos administradores de HTTP usan JWT independientes; no se presentan como perfiles de navegador. Los cambios posteriores de historial/chat/sincronización tienen pruebas de cálculo/API y compilación, sin nueva validación visual integral. Ver navegadores-nativos-limitacion.json y confirmaciones-navegador.json.

## Rendimiento y sincronización

Equipo/software: equipo-de-prueba.json; JDK final en seguridad-dependencias.json. Cálculos Node de10/30/100 y100 con294 enlaces en el mismo equipo: culling/curvas con trayectorias numéricas, diez segundos por escenario y un minuto adicional de reconciliación/autoorganización. No equivalen a rueda, arrastre físico, cuadros ni rasterización. p95 de cálculo por iteración: 0.0012 ms, 0.0026 ms, 0.0181 ms, 0.054 ms. Máximo de cada escenario está etiquetado solo para sus primeras50000 iteraciones. Tras GC, variación de heap en el minuto: 255392 bytes; no prueba ausencia general de fugas. Se ejecutó con respaldo MySQL concurrente y ese sesgo queda registrado. Reutilización comprobada:99 de100 objetos al editar uno; antes V22 reemplazaba todos. No se declara mejora medida de FPS.

La prueba API nueva guarda cien nodos y294 dependencias: layout 1.71 ms y guardado HTTP 164.21 ms, sin alterar anclas/acumulados. No demuestra fluidez visual. Las mediciones IAB V22 de46,30/40,46 cuadros/s permanecen como antecedentes; faltan comparación y sesión prolongada con gestos en V23. RNF-4 continúa parcial.

Sondeo HTTP de5 s, con mutación a1,3 s del ciclo: cambios de presencia, edición, nota y cierre/historial observados entre 3674.82 y 3703.14 ms. Es una medición del arnés HTTP programado, no latencia de pantalla. Carga moderada: 165 consultas en 61.04 s; p50 26.09, p95 33.62 y máximo 39.11 ms. CPU acumulada y memoria de procesos propios se muestrean cada10 s en el JSON. No es prueba de saturación ni rendimiento productivo. Caída real del backend y recuperación HTTP con sesión persistida comprobadas; red Internet y pestañas en segundo plano nativas pendientes. Se conserva el sondeo simple, sin WebSockets.

## Archivos, seguridad y recuperación

Seis formatos válidos con descargas y SHA256 exactos. PNG/JPG y MP4/WEBM decodificados con ffmpeg local; PDF de tres páginas comprobado con Poppler y rasterizado; DOCX CRC/OOXML íntegro. No se usa esa decodificación como prueba del visor UI. Ocho casos controlados rechazados400: firma incompleta/disfraz, vacío, ejecutable, ruta de archivo, ruta ZIP y expansión DOCX129MiB. PDF/MP4 truncados con firma correcta siguen admitidos: límite explícito del reconocimiento por cabecera, sin certificar previsualización universal. Se mantienen60MiB,300MiB y25 conservados por tarea, repetidos en la regresión general, sin debilitar el PDF protegido.

Respaldo completo: 5034379281 bytes, SHA256 `f69fa6e01a1cb5370994a83075df4cfb3ab8c446325afbad6841e246b883b068`, 164.0 s. Restauración final: 458.74 s, tras matar únicamente el cliente de una importación y repetirla. Diez tablas comparadas por filas y CHECKSUM EXTENDED, todos los BLOB cotejados por SHA256. Sesiones del dump funcionaron inicialmente en la copia, luego la invalidación las rechazó. Backend restaurado real en18087: login/refresh, revocación, rotación y firma nueva. Cinco verificaciones adicionales repitieron esos controles usando el hash exacto del JAR definitivo. Todo sobre instancia sintética33316, sin base personal. El dump y las claves no se distribuyen.

npm cero alertas; OWASP13 caché de25/10,47 dependencias/cero alertas. Actualizar NVD falló503; no se certifica actualidad. Se consultaron fuentes primarias y se usó Java portable actualizado, sin cambiar Java personal. Ver AUDITORIA_V0.5.23.md para avisos, controles y límites del limitador por proceso.

## Incidencias y reproducción

Error real corregido: versión de query no numérica respondía401; ahora400 JSON comprobado en MockMvc y HTTP. Nuevas protecciones409 de baja verificadas antes de modificar. Se corrigieron solicitudes tardías de historial/chat y el reemplazo de filas inalteradas. Las reglas de reloj aceptadas no cambiaron.

Los primeros arneses tuvieron problemas propios de nombre de SQL, codificación de Poppler, fixture de legado creado después de implementar relojes, variable de contraseña sintética ausente y comillas de cmd para Newman. Se corrigieron sin relajar aserciones ni cambiar reglas de negocio y se repitieron las suites afectadas. Ninguna ejecución fallida se contabiliza como aprobada. La evidencia final distingue estas incidencias del defecto HTTP real y del bloqueo nativo.

Reproducción: backend `mvnw.cmd -B clean verify`; frontend `npm run test:sprint5`, `npm run build`, `npm run lint`, `npm audit --json`. Los scripts públicos de integración exigen confirmación de entorno local y credenciales sintéticas privadas; las cuentas/datos se generan en una base aparte. Postman incluye ejemplo vacío, nunca el entorno privado usado. Maven XML y logs privados no se incluyen íntegros porque contienen rutas/metadatos de prueba; resumen estructurado verificable y pruebas fuente están incluidos. No se alteraron pruebas para conseguir aprobación.

Recomendación: Sprint6 abierto. Las pruebas técnicas locales no sustituyen criterios visuales pendientes, aceptación real del equipo ni certificación HTTPS productiva.
