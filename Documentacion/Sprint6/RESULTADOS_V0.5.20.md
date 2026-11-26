# Resultados reales de TimeFlow V0.5.20-SNAPSHOT

Ejecuciones nuevas del 15/11/2026 contra la candidata; los resultados V0.5.19 permanecen separados como antecedentes. Sprint abierto.

| Comprobación | Resultado | Evidencia V0.5.20 |
|---|---|---|
| Node | 86/86, sin fallos/omisiones | node-final.log |
| Vite | Compilación aprobada; PDF y worker diferidos | build-final.log |
| Lint | 0 errores, 13 advertencias, reglas intactas | lint-final.log |
| Maven clean verify / JUnit y MockMvc | 127/127, 0 fallos, errores u omisiones; JAR generado | maven-final.log; junit-final.xml |
| HTTP/MySQL general | 152/152 | integracion-mysql-final.json |
| Postman/Newman | 28 solicitudes; 32/32 aserciones | newman-resumen.json; newman-final.log |
| Sesiones con reinicio backend | 38/38 | renovacion-mysql.json |
| Conflictos de tareas | 27/27 | tareas-mysql.json |
| Conflictos de cuentas | 20/20 | usuarios-mysql.json |
| Conflictos de tipos | 18/18 | tipos-mysql.json |
| Carreras con bloqueo MySQL | 2 escenarios; cuota 25 y borrador 409/reintento | concurrencia-final.json |
| HTTPS directo y limpieza | 10/10 | https-y-limpieza.json |
| Restauración sintética | 5/5 comprobaciones SQL; sin login HTTP del esquema restaurado | restauracion-sintetica.json |
| Reinicio controlado MySQL | 503 → 200; hash de posiciones igual | recuperacion-mysql-final.json |
| PDF protegido | Canvas visible 834×1179 | pdf-canvas.jpg |
| DOCX/PDF descargados | Word abre/exporta DOCX; Poppler lee PDF | descargas-nativas.json |
| Mapa 100 nodos/160 aristas | 15 s, 92,99 FPS medios, p95 14 ms; zoom/reposo | mapa-rAF.json; mapa-100.jpg |
| npm audit | 0 alertas del lock actual | npm-audit.json |
| OWASP con caché | 87 entradas/47 únicas; 0 alertas, actualización NVD falló | owasp-cache.log; owasp-actualizacion-fallida.log |
| Word del backlog | 8 páginas revisadas, portada/estilos conservados, índice ajustado | docx-estructura.json; word-revision.json |

No sumar estos totales como si todos fueran pruebas independientes: hay solapamiento entre unitarias, regresión HTTP y escenarios adicionales. Las 50 pruebas específicas ejecutadas antes de la compilación final están incluidas en las 127 finales.

La primera compilación limpia falló porque el JAR estaba abierto por el backend sintético. Se esperó al fin de la regresión, se detuvo solo ese proceso y se repitió clean verify con éxito. El primer arnés TLS usó nombres de columna incorrectos en su fixture; se corrigió el arnés y se repitieron íntegramente sus 10 verificaciones. No se modificó el esquema para ajustarlo al arnés. Newman se ejecutó desde su instalación local después de que npx --no-install no encontrara el paquete desde la raíz. No se contabilizan esos intentos como aprobados.

La instrumentación del mapa fue temporal y se retiró antes del build. No se midió benchmark comparable de arrastre continuo. Los cambios posteriores a la regresión HTTP fueron metadatos de versión, documentación y utilidades/límite de errores frontend; Node/Vite/lint se repitieron sobre esas fuentes. El JAR final limpio arrancó con MySQL y fue usado por las comprobaciones de recuperación, descargas y Postman. HTTPS usó el mismo código backend antes del clean final.

Pendientes explícitos: reinicio completo Chrome/Edge, cerrar todas las pestañas y restaurar sin otra viva, dos administradores en perfiles UI independientes, revisión de todos los medios en ambos navegadores, NVD actualizado, criterios originales parciales, despliegue online/productivo y carga prolongada. Ver navegador-resultados.json, TRAZABILIDAD y PENDIENTES.
