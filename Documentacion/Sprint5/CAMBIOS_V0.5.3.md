# TimeFlow V0.5.3-SNAPSHOT - Corrección de plantillas

## Problema observado
En Mi Jornada y Bitácora, elegir una plantilla preestablecida distinta de la primera volvía a mostrar "Diseño UI/UX en Figma". Las tareas personalizadas funcionaban correctamente.

## Causa
El campo `<select>` entrega el ID seleccionado como texto, pero la comparación de la pantalla usaba igualdad estricta con IDs numéricos obtenidos de MySQL. El efecto consideraba inválida la nueva selección y la reemplazaba por la primera.

## Corrección
- Normalizar IDs de plantillas a texto para las comparaciones y el valor del selector.
- Mantener la selección elegida mientras siga existiendo, aunque se actualice la lista.
- Mostrar un mensaje cuando no existan plantillas disponibles.
- Evitar crear una tarea con un nombre genérico si la plantilla elegida es inválida.
- Agregar 6 pruebas nuevas de selección de plantillas.

No se modificó la lógica de las tareas personalizadas, la API, los datos guardados ni las tablas de MySQL. Se actualizó la etiqueta de versión de Maven para la entrega conjunta.

## Pruebas manuales pendientes
1. Con una jornada activa, seleccionar la segunda y tercera plantilla y comprobar su descripción.
2. Crear una tarea preestablecida usando una plantilla distinta de Figma y verificar su nombre guardado.
3. Recargar la página y repetir la selección.
4. Crear una tarea personalizada como antes.
5. Comprobar que Check In y Check Out continúen funcionando.
