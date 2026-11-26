# Resultados de TimeFlow V0.5.21-SNAPSHOT

Ejecuciones nuevas del 15/11/2026 sobre la candidata, sin tocar la base personal. Evidencias relativas a Evidencias/Sprint6/V0.5.21. Las versiones anteriores permanecen como historia.

| Prueba | Resultado real | Evidencia |
|---|---|---|
| Node final | 93/93, sin omisiones; 7 nuevas | node-final.log |
| Maven clean verify / JUnit y MockMvc | 148/148; 0 fallos, errores u omisiones; 21 nuevas | maven-final.log; junit-final.xml |
| Vite | Build aprobado del código final | build-final.log |
| Lint | 0 errores, 13 advertencias; sin desactivar reglas | lint-final.log |
| Integración HTTP/MySQL general | 152/152 | integracion-mysql-final.json |
| Funcionalidades V0.5.21 final | 49/49 | funcionalidades-final.json; scripts/probar_funcionalidades_v0521.py |
| Postman/Newman general | 28 solicitudes, 32/32 aserciones | newman-resumen.json; newman-final.log |
| Sesiones con cookies y reinicio backend | 38/38 | renovacion-mysql.json |
| Conflictos de tareas / cuentas / tipos | 27/27; 20/20; 18/18 | tareas-mysql.json; usuarios-mysql.json; tipos-mysql.json |
| Cuota concurrente y edición/posición | 2/2 escenarios con bloqueo MySQL | concurrencia-final.json |
| US-07 por etapa | 26/26 comprobaciones, notas paralelas/legado/permisos | notas-mysql.json; notas-http.log |
| US-10 por etapa | 25/25 exportadas, motivos y carrera 200/409 | rechazos-mysql.json; rechazos-http.log |
| US-19 por etapa | 67/67, páginas/filtros/privacidad/fechas | historial-mysql.json; historial-http.log |
| US-04 por etapa | 15/15, omisiones/blancos/fechas/estado inicial | creacion-mysql.json |
| US-05 por etapa | 11/11, plantillas activas/baja/permisos | plantillas-mysql.json |
| US-02 por etapa | 6/6 registradas; cancelar conserva jornada, confirmar 29 s exactos | jornada-mysql.json; checkout-advertencia.jpg; checkout-duracion.jpg |
| Migraciones | Notas/historial repetidas dos veces, datos anteriores intactos | migracion-notas.json; migracion-historial.json |
| Instalación limpia y upgrade exacto V0.5.20 | Ambos esquemas repetidos; legado Unicode intacto | compatibilidad-esquemas.json |
| Backup/restore V0.5.21 | 3/3 comprobaciones SQL; notas/rechazos conservados | restauracion-sintetica.json |
| Navegador | Flujos de seis US, F5, permisos y PDF; alcance IAB | navegador-resultados.json; capturas |
| npm audit | 0 alertas del lock consultado | npm-audit.json |
| Backlog Word | 8 páginas limpias, portada/índice/formato conservados | docx-estructura.json; word-revision.json |

No sumar todos los totales: hay casos solapados y ejecuciones por etapa además de la final. Las aserciones Newman corresponden a la colección general; las nuevas funcionalidades se prueban también con el script HTTP específico y JUnit/MockMvc. Las pruebas standalone de controladores no sustituyen las peticiones reales con JWT/permisos; ambos alcances se distinguen.

La primera preparación de datos de migración necesitó fijar UTF-8 del cliente MySQL para leer acentos: se corrigió el arnés y se repitió la comparación, sin cambiar datos para hacerla pasar. El diálogo nativo de salida no pudo verificarse en el arnés; la confirmación DOM final sí pasó cancelación/confirmación y consulta MySQL. En la prueba visual se detectó que campos date visibles podían no llegar al estado React; se corrigió el envío con FormData y se repitió el filtro real. No se cuentan esos intentos fallidos como aprobados.

Los cambios finales de solo frontend (versión/base de decisiones, protección de identidad al abrir detalle, legado de solo lectura tras 409 y carga inicial antes de salida) se verificaron con Node/Vite/lint repetidos; el PDF/F5 y aviso de salida se comprobaron con el código final. El último ajuste del legado tras revisar conflictos tiene cobertura de Node y conserva el mismo contrato HTTP. Backend/JAR no cambió después de clean verify y la regresión HTTP final.

El asistente Migrar_V0521.ps1 tiene verificación de sintaxis; sus SQL y respaldo/restauración se ejecutaron por el arnés aislado. No se afirma haber operado el asistente interactivo contra una base personal. El restore se validó por SQL, sin login HTTP del esquema restaurado ni ampliación de permisos.

Persisten: US-03, cronómetros US-06, RNF/aceptación parcial, Chrome/Edge completos y dos perfiles UI independientes, NVD actualizado y operación productiva. No hay nueva medición de 100 nodos ni barrido NVD/backend completo en esta entrega; las pruebas V0.5.20 son antecedentes.
