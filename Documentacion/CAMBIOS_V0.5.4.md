# TimeFlow V0.5.4. Dependencias y evidencias

Inicio del Sprint 6, sobre la base validada V0.5.3 del Sprint 5.

## Funciones nuevas

- Cada tarea puede depender de otra tarea o no tener dependencia.
- El servidor comprueba que la tarea previa exista, impide la dependencia consigo misma y detecta ciclos.
- El mapa muestra flechas celestes entre tareas relacionadas. Las tareas previas se iluminan al seleccionar una tarea. El resaltado permanece tras cerrar la ventana de detalle.
- El mapa mantiene las posiciones ya guardadas. Las posiciones automáticas se organizan por dependencias cuando están presentes.
- Se pueden adjuntar imágenes, PDF, DOCX, TXT, MP4 y WEBM a las tareas. Los archivos se guardan en MySQL en una tabla separada, con un máximo de 20 MB por archivo y 25 archivos por tarea.
- Las imágenes se pueden ampliar, los videos reproducir y los documentos descargar. Las evidencias de imágenes antiguas se siguen mostrando.
- Los permisos de subida y eliminación respetan el estado de la tarea y el responsable o administrador.

## Base de datos

Se agregan `tareas.dependencia_id` y la tabla `evidencias_tarea`. La actualización no elimina datos anteriores. Los respaldos de MySQL incluyen los archivos adjuntos.

## Estado de las pruebas

- Pruebas automáticas de geometría y dependencias del frontend: 21 de 21 aprobadas con Node.js.
- Código Java de validación de archivos: compilado con Java 21.
- Análisis de sintaxis de los archivos JavaScript y JSX: sin errores detectados.
- Compilación completa de Vite, JUnit, Postman y pruebas en navegador con MySQL: pendientes de realizar en Windows.

## Límites conocidos

- Solo se permite una tarea previa por tarea.
- Una dependencia muestra la relación en el mapa, pero no impide marcar una tarea como terminada.
- Los archivos de video se descargan completos antes de comenzar la reproducción.
- No se ha verificado el comportamiento con cargas masivas de documentos.
