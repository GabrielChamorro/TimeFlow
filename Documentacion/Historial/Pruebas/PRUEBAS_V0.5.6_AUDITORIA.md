# TimeFlow V0.5.6. Pruebas antes de usar como versión estable

La actualización conserva las tablas anteriores. Antes de instalarla, respalda el proyecto y la base teamflow_db. No copies contraseñas ni el archivo privado config_local.bat a GitHub.

## Preparar el proyecto en Windows

1. Utiliza una copia de V0.5.5 y aplica el parche. Si usas el ZIP completo, conserva la configuración privada existente en backend/config_local.bat.
2. Detén backend y frontend.
3. Ejecuta ACTUALIZAR_BD_V0.5.6_AUDITORIA.bat desde la carpeta principal. El script utiliza el respaldo previo de MySQL. Si falla, no inicies la nueva versión.
4. Ejecuta ACTUALIZAR_VITE_SEGURO.bat con Internet disponible. Actualiza Vite a 8.2.6, instala dependencias y registra el resultado de npm audit. Si falla, no expongas el servidor de desarrollo a la red.
5. Ejecuta PROBAR_MIGRACION_SPRING4.bat para compilar y ejecutar las pruebas JUnit del backend.
6. En frontend, ejecuta npm.cmd run test:sprint5 y npm.cmd run build.

## Comprobaciones de uso

- Iniciar sesión con administrador y trabajador.
- Crear una tarea con un trabajador, asignarla y comprobar que solo él o el administrador puedan editarla.
- Crear dos cuentas con el mismo nombre. Comprobar que una de ellas no pueda modificar ni descargar adjuntos de tareas de la otra.
- Abrir Monitoreo Espacial y Nodos. Comprobar que se mantienen los nodos de las demás personas sin exponer sus bitácoras o evidencias privadas.
- Subir un PDF o video de 5 a 20 MB. Comprobar que se guarde y pueda descargarse con la cuenta permitida.
- Intentar descargar el mismo adjunto desde otra cuenta trabajadora. Debe responder 403.
- Desactivar una tarea y un archivo. Deben ocultarse sin borrarse de MySQL.
- Reactivarlos como administrador y comprobar que recuperan la información original.
- Probar el mapa con 100 nodos y comprobar que sus dependencias siguen funcionando.
- Ejecutar las colecciones de Postman sobre datos temporales nuevos y comprobar que las operaciones no modifican datos reales.

## Resultado necesario

Guardar el resumen de JUnit, las pruebas de frontend, el resultado de npm audit, las capturas de Postman y cualquier error de MySQL. Hasta que esas verificaciones se completen, la V0.5.6 permanece en pruebas.
