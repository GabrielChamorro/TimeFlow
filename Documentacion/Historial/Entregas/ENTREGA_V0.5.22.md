# Entrega de TimeFlow V0.5.22-SNAPSHOT

16/11/2026. Continuación directa de V0.5.21, sin reconstrucción. Sprint 6 ABIERTO.

Presencia verde/roja por jornada real, con consulta cada 5 s y latencia medida; tres cronómetros persistentes e independientes, con reglas documentadas y legado desconocido explícito. Actualización automática de tareas, jornada y métricas. Correcciones del bloqueo tras aprobación y del visor de imagen ampliada.

Pruebas nuevas sobre V22: 102 Node, 160 JUnit/MockMvc, 152 HTTP generales, 49 funcionales anteriores repetidas, 64 del script V22 y 40 aserciones Postman. Vite y Maven clean verify aprobados; lint con advertencias explícitas. Presencia, cronómetros, 100 nodos, rueda/pan/Escape, métricas y autoorganización comprobados en IAB. Ver RESULTADOS para alcances y fallos iniciales; no sumar pruebas solapadas.

## Instalar desde la base personal V0.5.19

Usar directamente el ZIP completo V0.5.22. Con backend detenido y respaldo previo, aplicar registros V0.5.21, historial V0.5.21 y tiempos V0.5.22, en ese orden. Se incluyen los tres SQL y scripts/Migrar_V0522.ps1 con respaldo automático. No instalar versiones intermedias. Leer Documentacion/Sprint6/INSTALAR_Y_MIGRAR_V0.5.22.md antes de arrancar frontend y backend juntos.

## Contenido

- ZIP completo: fuentes, dist, JAR en bin, documentación Word, matrices y evidencias saneadas.
- Delta desde V0.5.21: solo fuentes nuevas/modificadas y ARCHIVOS_CAMBIADOS.json; recompilar si se usa el delta.
- JAR separado, ZIP de las tres migraciones y helper, informes/Word/trazabilidad separados.
- MANIFIESTO_SHA256.json cubre TODOS los archivos de entrega, incluido este LEEME separado. Se verifican también las copias equivalentes dentro del ZIP completo y del delta.

La base personal no fue consultada ni modificada. No se distribuyen secretos, configuraciones privadas, bases, dumps ni dependencias descargadas.

## Pendientes de cierre

Despliegue online, usabilidad con usuarios, rendimiento prolongado/comparativo, certificación Chrome/Edge nativos, todos los diálogos de eliminación, NVD actualizado y restore operativo completo. Cancelar tarea está comprobado; el intento de confirmación nativa de archivo no acredita Cancelar. Sondeo de 5 s no equivale a instantaneidad. No se declara versión estable ni Sprint 6 cerrado.
