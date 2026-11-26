# TimeFlow V0.5.8-SNAPSHOT — Dependencias múltiples

## Cambio funcional

Una tarea admite **0, 1 o varias dependencias**. En el formulario se pueden marcar varias tareas previas y quitarlas individualmente o todas a la vez. El mapa muestra una conexión por relación, con los cheurones apuntando **del origen (requisito previo) hacia el destino (tarea dependiente)**. Se conservan las mejoras visuales del parche anterior.

Se añadió `dependenciaIds: [id1, id2, ...]` en lugar del antiguo `dependenciaId` (un solo número). Los clientes antiguos deben migrar a la nueva API. No se impone una tarea previa obligatoria.

## Base de datos — paso obligatorio ANTES de iniciar el backend nuevo

1. Apagar el backend TimeFlow y respaldar la base de datos.
2. Ejecutar `ACTUALIZAR_BD_V0.5.8.bat` desde la carpeta raíz. Utiliza `backend\crear_base_datos.bat`, que crea un respaldo antes de aplicar el esquema (requiere `backend\config_local.bat`).
3. Confirmar que existe `tarea_dependencias` y que las dependencias antiguas fueron migradas. Consulta recomendada:
   ```sql
   SELECT tarea_id, dependencia_id FROM tarea_dependencias ORDER BY tarea_id, dependencia_id;
   ```
4. Iniciar el backend y el frontend V0.5.8. No utilizar el frontend nuevo con el backend viejo, ni a la inversa.

La migración añade una tabla de relaciones y **no borra ninguna tarea**. Los valores anteriores de `tareas.dependencia_id` se copian a la nueva tabla y luego se limpian, porque ahora la tabla de relaciones es la fuente oficial. La columna histórica sigue existiendo para compatibilidad del esquema, pero ya no se consulta desde Java.

## Comprobaciones recomendadas en el equipo del usuario

- Crear tarea C con dependencias de A y B, recargar la página y confirmar que ambas se conservan y aparecen como dos flechas hacia C.
- Editar C, quitar A sin perder B y comprobar que A no reaparece después de reiniciar el programa ni al volver a ejecutar la migración.
- Intentar crear C dependiente de C, y cerrar ciclo indirecto A→B→C→A: el backend debe rechazar la operación.
- Desactivar una tarea que sea dependencia de otra: no se debe dibujar la conexión mientras no esté visible, pero su historial debe seguir almacenado.
- Probar varias tareas que compartan un mismo requisito, arrastrar nodos, usar zoom y aplicar filtros.
- Repetir las pruebas JUnit, la compilación y pruebas integradas con MySQL y Postman.

## Estado de validación

El cambio fue implementado en el código y se ejecutaron las pruebas automáticas Node del frontend. Quedan pendientes el build completo con Vite, JUnit y pruebas reales con MySQL/Windows. Se mantiene la clasificación SNAPSHOT.
