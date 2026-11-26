# TimeFlow V0.5.4. Comprobaciones de instalación y uso

## Preparación de la base de datos

Antes de iniciar V0.5.4, detener backend y frontend, respaldar la base y ejecutar `ACTUALIZAR_BD_V0.5.4.bat` desde la carpeta principal. El proceso usa `backend/config_local.bat` de la instalación local. El archivo es privado y no forma parte del ZIP.

La actualización utiliza el instalador de base de datos existente, que prepara un respaldo con MySQL antes de realizar los cambios. También puede ejecutarse directamente `backend/sql/migracion_v0.5.4_dependencias_evidencias.sql` desde MySQL Workbench si ya existe un respaldo.

## Comprobaciones funcionales

1. Crear una tarea A sin dependencia.
2. Crear una tarea B y elegir A como tarea previa.
3. Crear C dependiente de B. Comprobar flechas y orden del mapa.
4. Abrir C, cerrar el detalle y comprobar que A y B permanecen resaltadas.
5. Intentar editar A para hacer que dependa de C. El sistema debe impedir el ciclo.
6. Cambiar una dependencia a «Ninguna» y comprobar que desaparece la conexión correspondiente.
7. Adjuntar una imagen, un PDF, un DOCX y un video MP4 pequeño. Abrirlos y descargarlos desde la tarea.
8. Intentar adjuntar HTML renombrado como PNG y comprobar que sea rechazado.
9. Comprobar que un trabajador no puede modificar archivos de tareas ajenas ni tareas finalizadas.
10. Reiniciar la aplicación y verificar que siguen guardados las dependencias y los archivos.
11. Ejecutar `npm.cmd run test:sprint5` y `npm.cmd run build` dentro de `frontend`.
12. Ejecutar `PROBAR_MIGRACION_SPRING4.bat` y las colecciones Postman. Realizar respaldo antes de las pruebas con escritura.

Los archivos adjuntos se almacenan en MySQL. Por eso los respaldos pueden ocupar más espacio que en versiones anteriores.
