# Registro de pruebas V0.5.8 — dependencias múltiples

## Ejecutado en esta revisión

- `node --test frontend/tests/*.test.mjs`: **35/35 correctas**.
- Prueba independiente de compilación Java 21 de `DependenciaTareaRules` con un modelo mínimo y casos de múltiples requisitos, duplicados y ciclos: **3/3 correctos**. Esta prueba no reemplaza la ejecución de JUnit ni la compilación de Spring Boot.

## No verificado aún

- Build completo de Vite (las dependencias de npm no están completas en este entorno).
- Suite JUnit/Maven del backend completo (Maven y sus dependencias no están disponibles localmente).
- Aplicación real de SQL sobre MySQL y persistencia con JPA.
- Pruebas integradas de UI, API y escrituras simultáneas.

## Procedimiento de validación pendiente

1. Apagar el backend anterior.
2. Ejecutar `ACTUALIZAR_BD_V0.5.8.bat` y comprobar que se creó un respaldo.
3. Ejecutar `backend\mvnw.cmd test` en Windows.
4. Ejecutar `npm ci` y `npm run build` en la carpeta frontend (el paquete hereda versiones del ZIP previo).
5. Probar crear y editar una tarea con al menos dos dependencias, volver a cargar, comprobar el gráfico y volver a ejecutar la migración sin reintroducir relaciones eliminadas.
6. Probar una dependencia repetida, inactiva, inexistente y circular desde la API y confirmar error HTTP 400.
