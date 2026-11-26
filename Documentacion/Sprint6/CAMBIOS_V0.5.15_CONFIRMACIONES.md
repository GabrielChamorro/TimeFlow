# TimeFlow V0.5.15-SNAPSHOT — Confirmaciones de desactivación

**Base:** V0.5.14-SNAPSHOT, sin cambios en el esquema SQL ni en las API.

## Cambios

- **Usuarios:** la desactivación desde el directorio tiene tres etapas: advertencia con datos de la cuenta, escritura del correo seleccionado y revisión final antes de enviar la solicitud. Mientras no se complete, el botón final permanece deshabilitado.
- **Tipos de tarea:** se solicita revisar la advertencia y escribir el nombre de la plantilla en un segundo paso antes de desactivarla.
- **Edición de usuarios:** se impide cambiar un usuario existente a «Inactivo» desde el selector de estado, lo que antes permitía evitar el flujo de advertencias. Sigue permitida la reactivación mediante la acción existente. La creación de nuevas cuentas puede definir su estado inicial.
- **Uso:** se puede cancelar, volver atrás y corregir el texto en cualquier momento antes del envío; las operaciones se envían una sola vez, y un error del servidor se muestra sin cerrar el diálogo.
- **Sin eliminación:** las operaciones existentes hacen desactivación lógica. La información se conserva para reactivarla.
- **Mapa:** no se agregó el botón de autoorganización. Los criterios deben acordarse antes de desarrollarlo.

## Archivos modificados

- `frontend/src/components/ConfirmDeactivation.jsx` (nuevo)
- `frontend/src/utils/deactivationConfirm.js` (nuevo)
- `frontend/src/pages/Usuarios.jsx`
- `frontend/src/pages/TaskTypesView.jsx`
- `frontend/tests/deactivationConfirmV0515.test.mjs` (nuevo)
- `frontend/package.json`, `frontend/package-lock.json`, `backend/pom.xml` (versiones)
- `README.md` y este informe

## Pruebas

- `node --test tests/*.test.mjs`: 57 de 57 aprobadas, incluidas 3 pruebas nuevas.
- Análisis sintáctico JS/JSX con TypeScript: 25 archivos sin errores sintácticos.
- Queda pendiente probar visualmente el flujo de tres pasos en el navegador, `npm ci && npm run build`, Maven y las operaciones reales con MySQL en Windows.

**Estado:** SNAPSHOT, no certificado como versión estable.
