# Resultados ejecutados en V0.5.18-SNAPSHOT

Fecha: 14 de noviembre de 2026 (America/Santiago). Sprint 6 abierto. Evidencia: `Evidencias/Sprint6/V0.5.18/`.

| Verificación final | Resultado | Evidencia |
| --- | --- | --- |
| npm ci | Correcto; se detuvo Vite tras un intento EPERM por archivo en uso | npm-ci-final.log |
| Node | 76/76, sin omisiones | node-final.log |
| Producción Vite | Correcta | build-final.log |
| Lint | 0 errores; 16 advertencias | lint-final.log |
| Maven clean verify | 100/100 JUnit/MockMvc, 0 fallos/errores/omitidas; JAR generado | maven-final.log, junit-final.xml |
| HTTP + MySQL 8.4.13 | 151/151 comprobaciones; 42.24 s para la ronda | integracion-mysql-final.json/.log |
| Postman/Newman | 28 solicitudes, 32/32 aserciones | newman-final.log |
| Concurrencia MySQL | Cuota 201/400 y 25 archivos; edición y movimiento conservados | concurrencia-final.json |
| Recuperación MySQL | 503 durante caída, 200 después; mismo hash de posiciones | recuperacion-mysql-despues.json |
| HTTP adicional | JSON chunked >4 MiB: 413; subida interrumpida sin persistencia; noveno login: 429 | http-interrupciones-y-limites.json |
| Migración V0.5.8 | Conserva relaciones y permite reejecución sin reintroducir una relación quitada | migracion-v058-mysql.json |
| npm audit | 0 avisos reportados | npm-audit-final.json |
| OWASP con caché | Ejecutado sin hallazgos reportados; NVD al 25 de octubre; OSS Index sin credenciales | owasp-final.json/.html, owasp-final-cache.log |
| OWASP actualizado | **No completado**, falta de clave NVD | owasp-actualizacion-fallida.log |
| Navegador con MySQL | 100 nodos, 126 dependencias, 0 superposiciones medidas en vista previa | mapa100-geometria-dom.json, capturas |
| Word | 8 páginas revisadas mediante exportación nativa y Poppler; portada/estilos conservados, índice corregido | docx-estructura.json, docx-verificacion-visual.json |

El conteo HTTP incluye aserciones de contenido e integridad además de respuestas; no significa 151 historias de usuario distintas. Las pruebas Node existentes incluyen verificaciones estáticas de fuentes, además de cálculos ejecutables. No equivalen a 76 flujos completos de navegador. Las pruebas JUnit usan mocks donde corresponde; la persistencia se validó por separado con MySQL real.

Las evidencias iniciales conservan 74 Node y 89 JUnit con un fallo. `java-regresiones-antes.log` registra seis fallos de siete casos nuevos antes de corregirlos; `mapa-regresiones-antes.log` registra dos fallos del mapa. La primera ronda integrada se detuvo por un HTTP 401 incorrecto al exceder 60 MiB. La carrera de cuota dejó 26 registros en la reproducción anterior. Se mantienen como evidencia fallida, no como aprobación.

La última ronda completa `integracion-mysql-final` se ejecutó con el mismo JAR final de 100 pruebas JUnit. Los resultados `ronda2`, `iteracion3` y verificaciones intermedias documentan etapas anteriores de esta misma entrega; no sustituyen la última ronda. El análisis OWASP y Postman se repitieron sobre la revisión final.

Los archivos grandes se enviaron realmente como multipart y se almacenaron en LONGBLOB. Cinco cargas de 60 MiB completaron 300 MiB; se descargó un archivo de 60 MiB con SHA-256 idéntico. Se probaron 60 MiB + 1 byte, archivo 26 y cuotas que incluyen desactivados. Hubo esperas de redo log en el MySQL de prueba con capacidad por defecto de 100 MiB: no se atribuye rendimiento de producción a estos tiempos ni se modifica el servidor del usuario.

Se comprobó la recuperación después de reiniciar el backend de prueba y MySQL. El primer arnés no reabrió MySQL correctamente y terminó con error propio; se conservó su log. En la repetición se esperó la liberación de InnoDB y se completó la verificación de recuperación. No se ensayaron cortes eléctricos ni restauración de un respaldo real.

La vista previa y Cancelar conservaron el SHA-256 de las 100 posiciones: `0560a1f87ef1fc8a002944ed3fc9b51a355acb72a9bc2ac83f45779ecdda434f`. Aplicar guardó las 100 posiciones. Un arrastre manual confirmado cambió el hash a `adfb4afd666e4252b672b9eabae3fe200b940f78180484e5f16362eaf34363d0`, conservado después de reiniciar MySQL. La recarga mostró las 100 tarjetas sin errores de consola observados.

JAR verificado: `backend-0.5.18-SNAPSHOT.jar` (57578215 bytes).

SHA-256: `1ec5e94087bbd0e99f272539d324602804546e1ce45b7599fb056eaafceb6fd6`.

No se declara el Sprint cerrado: faltan definiciones completas de US/RNF, auditoría NVD actual y los riesgos enumerados en `AUDITORIA_V0.5.18.md`. La apertura del PDF protegido en el navegador integrado y la apertura del DOCX descargado en su aplicación siguen pendientes.
