# TimeFlow V0.5.5 - Pruebas de desactivacion

## Instalacion

1. Conservar un respaldo de V0.5.4 y su base `teamflow_db`.
2. Copiar el parche V0.5.5 sobre V0.5.4 con los servidores detenidos.
3. Conservar el archivo privado `backend\config_local.bat` de la instalacion anterior.
4. Ejecutar `ACTUALIZAR_BD_V0.5.5.bat`. El instalador debe confirmar el respaldo y la estructura.
5. Iniciar el backend y frontend como normalmente.

## Comprobaciones

1. Crear una tarea de prueba con descripcion y bitacora. Desactivarla. Debe desaparecer de la jornada y del mapa.
2. Comprobar en MySQL que la tarea sigue en `tareas` y que `activo` vale `0`. La bitacora y las evidencias deben permanecer.
3. Crear dos tareas, B dependiente de A. Desactivar A. B debe seguir visible y la conexion a A debe desaparecer. La columna `dependencia_id` de B debe conservar su valor anterior.
4. Desactivar una plantilla de prueba. Debe desaparecer del selector, pero permanecer en `tipos_tarea` con `activo=0`.
5. Desactivar un usuario de prueba que no sea el administrador conectado. Debe desaparecer de la lista y su inicio de sesion debe quedar bloqueado. Las jornadas anteriores deben conservarse.
6. Subir una evidencia de prueba y desactivarla. Debe desaparecer de la galeria, pero permanecer en `evidencias_tarea` con `activo=0`. Su enlace anterior no debe entregar el archivo.
7. Comprobar que una tarea finalizada mantenga las restricciones de edicion que tenia la version anterior.
8. Repetir las pruebas JUnit, frontend y Postman. Las colecciones de Postman con usuarios o plantillas temporales fijos pueden requerir nombres nuevos porque la desactivacion conserva los identificadores originales.

## Comandos de pruebas

Desde `frontend`, ejecutar `npm.cmd run test:sprint5` y `npm.cmd run build`.
Desde la carpeta principal, ejecutar `PROBAR_MIGRACION_SPRING4.bat`.

## Como funcionan los estados

- En `tareas`, `tipos_tarea`, `mensajes` y `evidencias_tarea`, `activo=1` significa visible y `activo=0` significa desactivado.
- En `usuarios` se usa la columna existente `estado`: `activo` o `inactivo`.
- Las operaciones DELETE de la aplicacion responden 204 cuando desactivan correctamente. No borran filas.
- Las listas normales solo muestran registros activos.
- Un administrador puede reactivar desde la API con PATCH sobre `/api/tareas/{id}/reactivar`, `/api/usuarios/{id}/reactivar`, `/api/tipos-tarea/{id}/reactivar`, `/api/mensajes/{id}/reactivar` y `/api/tareas/{tareaId}/evidencias/{id}/reactivar`.
- Reactivar no esta incluido en el menu normal de la aplicacion. No se pierde la informacion archivada.

## Estado de la revision

Se completaron 26 pruebas de frontend con Node. Las pruebas JUnit nuevas fueron preparadas, pero falta ejecutarlas en el entorno de Windows con Maven. No se ha probado la migracion sobre una base real en este entorno.
