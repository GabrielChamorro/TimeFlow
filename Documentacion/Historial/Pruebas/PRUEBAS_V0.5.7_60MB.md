# TimeFlow V0.5.7, pruebas de archivos de 60 MB

Versión candidata del Sprint 6. No se da por estable hasta validar en Windows.

## Preparación

- Respaldar `teamflow_db` y conservar la configuración local.
- La tabla `evidencias_tarea` ya usa LONGBLOB. Para instalaciones V0.5.6 no se necesita nueva migración SQL por este cambio.
- En MySQL ejecutar `SHOW VARIABLES LIKE 'max_allowed_packet';`. Se recomienda un valor de al menos 134217728 bytes (128 MiB).
- Si es menor, ajustarlo mediante la configuración `max_allowed_packet=128M` del servidor MySQL y reiniciar el servicio. No se modifica automáticamente.

## Verificaciones

1. Ejecutar `npm.cmd run test:sprint5` y `npm.cmd run build` desde `frontend`.
2. Ejecutar `PROBAR_MIGRACION_SPRING4.bat` desde la raíz.
3. Crear una tarea de prueba y adjuntar un documento o video de aproximadamente 50 a 60 MB.
4. Descargarlo y comprobar que el contenido sea íntegro.
5. Intentar adjuntar uno de más de 60 MB. Debe ser rechazado por la interfaz y el backend.
6. Comprobar que el total conservado por tarea no exceda 300 MB, incluyendo archivos desactivados.
7. Confirmar que solo los usuarios autorizados acceden a los archivos y que no hay errores de MySQL.

## Limitaciones

No hubo pruebas reales de carga de 60 MB contra MySQL en el entorno de preparación. Con archivos grandes aumenta el uso de memoria, disco y espacio de respaldos.
