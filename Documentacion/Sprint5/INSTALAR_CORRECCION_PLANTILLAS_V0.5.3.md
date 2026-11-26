# Cómo instalar la corrección del selector (TimeFlow V0.5.3-SNAPSHOT)

## Antes de comenzar

Esta actualización se aplica sobre **TimeFlow V0.5.2-SNAPSHOT**. Corrige el problema de que el selector de tareas preestablecidas vuelve a la primera plantilla. No cambia la base de datos ni los controladores del backend.

1. Cierra los procesos del frontend y haz una copia de la carpeta de TimeFlow.
2. Extrae el contenido del ZIP del parche en la **carpeta raíz de tu proyecto actual**, donde están `frontend`, `backend` y `.gitignore`. Acepta reemplazar los archivos incluidos.
3. Si usas Git, ejecuta `git status` y comprueba que solo aparecen los archivos esperados. No hagas el commit hasta terminar las pruebas.
4. En una ventana de PowerShell dentro de la carpeta `frontend`, ejecuta por separado:

   ```powershell
   npm run test:sprint5
   npm run build
   ```

   Si todavía no instalaste las dependencias, ejecuta `npm ci` antes. Si `npm run build` falla, conserva el error para revisarlo.
5. Inicia los servidores normalmente. Abre `http://localhost:5173/` y entra en **Mi Jornada y Bitácora** con una jornada activa.
6. En **Pre-Establecida**, selecciona la segunda plantilla y comprueba que su descripción cambia. Repite con una tercera. Comprueba que no vuelve sola a **Diseño UI/UX en Figma**.
7. Crea una tarea con otra plantilla y verifica el nombre y la descripción en **Mis Tareas Asignadas**. Repite tras recargar la página.
8. Cambia a **Personalizada** y comprueba que puedes crear una tarea como antes.
9. Si los resultados son correctos, realiza el commit de los cambios y envíalo a GitHub.

## Qué está verificado

- `npm run test:sprint5`: 16/16 pruebas de Node.js aprobadas.
- Análisis de sintaxis JSX con TypeScript: sin errores de análisis.

## Qué está pendiente

- Compilar Vite en tu Windows (`npm run build`).
- Confirmar el cambio de plantillas y la creación real con tu MySQL.
- Regresión general de JUnit y Postman (Sprint 5).

## Nota sobre versiones

Se actualiza la versión de frontend a `0.5.3-sprint5.0` y la versión del proyecto Maven a `0.5.3-SNAPSHOT` para identificar el paquete. **No se cambió código Java.**
