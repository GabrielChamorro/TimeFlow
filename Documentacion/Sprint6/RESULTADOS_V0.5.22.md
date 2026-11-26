# Resultados de TimeFlow V0.5.22-SNAPSHOT

Ejecuciones del 16/11/2026, America/Santiago, sobre código V0.5.22 y MySQL sintético independiente en 33316. Evidencias relativas a Evidencias/Sprint6/V0.5.22. Los resultados V21 fueron antecedentes y se repitieron las suites indicadas.

| Prueba | Resultado | Evidencia |
|---|---|---|
| Node final | 102/102, 0 omisiones; 9 nuevas desde V21 | node-final.log |
| Maven clean verify, JUnit/MockMvc | 160/160, 0 fallos/errores/omisiones; 12 nuevas | maven-final.log; junit-final.xml |
| Vite | Build aprobado, sin sonda temporal | build-final.log |
| Lint | 0 errores; 13 advertencias, reglas intactas | lint-final.log |
| HTTP/MySQL general | 152/152 | integracion-mysql-final.json |
| Funcionalidades V21 repetidas | 49/49 | funcionalidades-final.json |
| Script público V22 final | 64/64 | cronometros-publica-final.json; scripts/probar_funcionalidades_v0522.py |
| Postman/Newman | 32 solicitudes, 40/40 aserciones | newman-resumen.json; newman-final.log |
| Sesiones HttpOnly, renovación, revocación y reinicios | 38/38 | renovacion-mysql.json |
| Conflictos de cuentas / tipos / tareas | 20/20; 18/18; 27/27 | usuarios-mysql.json; tipos-mysql.json; tareas-mysql.json |
| Cuotas/edición concurrentes | 2 escenarios aprobados | concurrencia-final.json |
| Presencia por etapa | 63/63 | presencia-mysql.json |
| Cronómetros por etapa, con reinicio real backend y SQL | 81/81 | cronometros-mysql.json |
| Parciales y conjunto nuevo de 100 nodos/90 enlaces | 224/224 comprobaciones, principalmente preparación/HTTP | parciales-y-mapa100.json |
| Esquemas V19/V21, repetición, respaldo y restore SQL | 11/11 | migraciones-y-respaldo.json |
| npm audit | 0 alertas en el lock consultado | npm-audit.json |
| Word | 8 páginas inspeccionadas; formato y portada conservados; índice corregido | docx-estructura.json; word-revision.json |

Los conjuntos se solapan: no sumarlos como un total de pruebas independientes. Los 224 controles del mapa incluyen creación/preparación de fixtures y no equivalen a 224 pruebas de navegador.

## Navegador real IAB

- Presencia: entrada/salida visibles en el administrador sin F5; 3782 ms y 1304 ms desde ACK a recepción. Consulta cada 5 s; no es instantánea. presencia-latencia.json separa medición del tiempo de herramientas.
- Tres cronómetros con anclas distintas, legado desconocido, nota aislada B y pausa en 00:00:50. F5, cambio de sección/pestaña, otro cliente y reinicio real Vite conservaron tiempos. Diferencia observada entre clientes de hasta 1 s. El reinicio backend también se comprobó con HTTP/MySQL.
- Aprobación remota bloqueó un modal abierto; ambos roles sin Guardar/Desactivar/Aprobar en finalizada. Trabajador sin navegación administrativa; API 403 repetida.
- PNG/JPG completos de 343×361, vista previa y visor ampliado corregido a BODY/viewport, con Escape.
- 100 nodos montados, 90 enlaces; KPIs 100/33/33/33 y luego 100/34/33/34 tras cambio externo, sin F5. Rueda 0,160156 → 0,24; pan 100×60 exacto; Escape salió de pantalla completa.
- rAF: 30,0017 s/1389 cuadros/46,30 cuadros/s/p95 27,8 ms/21 intervalos >50 ms; segunda muestra 30,004606 s/1214 cuadros/40,46/p95 27,9 ms/33 >50 ms. Lote de 12 arrastres y 12 ruedas de 9,14 s incluido en segunda muestra. No es prueba prolongada ni comparación contra menos nodos.
- Autoorganización: vista previa de 397 tareas, Cancelar conservó hash de posiciones y Aplicar cambió 383; contraste MySQL.
- Jornada: Check-out desde otro cliente reflejó salida, duración y botones automáticamente sin F5; los relojes de tareas En Progreso siguieron su regla independiente.
- Sin errores React de tipo ReferenceError/TypeError/import/hooks en la consulta de consola final. Errores de conexión durante reinicios se trataron como conexión/reintento, no como aprobación funcional.

Ver parciales-navegador.json, mapa-interaccion.json, autoorganizacion-navegador.json y las capturas finales. IAB es navegador real integrado; no se presenta como Chrome/Edge nativos ni como dos perfiles separados. Las diferencias del reloj de pared del cliente se simulan en pruebas puras con Date.now; no se alteró el reloj del sistema.

## Fallos y límites conservados

fallos-y-correcciones.json y logs iniciales registran compilación de genéricos/Jackson, orden de props esperado por un test histórico, ajustes de arnés SQL/DTO/fixtures y el primer sondeo que omitía la pestaña de fondo. Todos se corrigieron y se repitieron las suites sin desactivar pruebas.

La confirmación nativa del archivo agotó el tiempo de IAB y el JPG terminó desactivado: no se certifica Cancelar/cerrar ese diálogo. Cancelar tarea sí se comprobó y conservó datos. El archivo sintético desactivado sigue guardado en MySQL; la vista final usó otro JPG. El visor recortado se corrigió mediante portal y volvió a comprobarse.

render_docx.py falló por ausencia de soffice.exe; se diagnosticó y se usó Word en solo lectura para exportar PDF, Poppler y revisión de las ocho páginas. Los PNG/PDF de QA no se distribuyen como documentos finales.

RNF-1 requiere usabilidad con usuarios; RNF-2 online productivo no probado; RNF-3 tiene sondeo medido para presencia y comprobaciones automáticas de tareas/jornada/métricas, sin garantía instantánea/distribuida; RNF-4 necesita carga prolongada/comparativa; RNF-5 tiene gestos y Escape comprobados en IAB, sin medir latencia individual ni certificar todos los navegadores. NVD actualizado, restore operativo completo, todos los formatos nativos y todos los diálogos siguen explícitos en PENDIENTES.
