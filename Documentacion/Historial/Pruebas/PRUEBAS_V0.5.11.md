# Probar TimeFlow V0.5.11 en Windows

1. Conserva un respaldo de la carpeta V0.5.10 y de MySQL antes de actualizar. Extrae este ZIP en otra ubicación.
2. Apaga frontend y backend antiguos para evitar puertos duplicados.
3. No ejecutes una migración nueva: **V0.5.11 usa la misma base de datos que V0.5.10**.
4. Inicia el backend con `backend\iniciar_servidor.bat` y el frontend con `frontend\iniciar_servidor.bat`.
5. Como administrador: entra a Tipos de tareas, crea una plantilla, edítala, intenta repetir su nombre, desactívala, cambia el filtro a Desactivadas y reactívala.
6. En Gestión de usuarios: busca por nombre/correo, filtra por rol y estado, crea una cuenta, edita sus datos, desactívala y reactívala. Revisa que tu propia cuenta no permita desactivación desde la interfaz.
7. Con una cuenta trabajadora: comprueba que no puede abrir `/api/usuarios/administracion` ni `/api/tipos-tarea/administracion` (deben devolver 403).
8. Cambia la contraseña de tu propia cuenta administradora; debería pedir iniciar sesión de nuevo.
9. Comprueba que Monitoreo Espacial, dependencias múltiples, chat y adjuntos siguen funcionando.
10. Para automatizar: ejecuta `npm ci`, `npm run test:sprint5`, `npm run build` en frontend y `mvnw.cmd clean verify` en backend.

Ante un error, guarda la consola del navegador (F12) y los últimos mensajes del backend.
