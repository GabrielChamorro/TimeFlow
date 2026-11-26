# Comprobación de TimeFlow V0.5.10 (Windows)

1. Conserva un respaldo de tu base de datos y deja la V0.5.9 original disponible.
2. Cierra frontend y backend antes de sustituir archivos.
3. Extrae el proyecto completo en una **carpeta nueva**; no elimines `backend/config_local.bat` de tu instalación original. Copia tu configuración local a la nueva carpeta `backend` si la necesitas, sin subirla a Git.
4. **No ejecutes una nueva migración de MySQL.** Usa la base que ya funcionaba con V0.5.9.
5. En `frontend`, ejecuta `npm ci`, `npm run test:sprint5` y `npm run build`.
6. En `backend`, ejecuta `mvnw.cmd clean verify`. Comprueba que las pruebas JUnit pasen sin errores.
7. Inicia backend y frontend. Como los tokens anteriores no incluyen la marca de seguridad nueva, **vuelve a iniciar sesión**.
8. En Monitoreo Espacial, verifica tareas reales, flechas de varias dependencias, selección, arrastre administrativo y zoom.
9. Edita y guarda una tarea. Comprueba que si el servidor rechaza una operación, el modal siga abierto y muestre el error.
10. Prueba que un trabajador vea nombres en chat pero no correos ajenos en `/api/usuarios` y que no pueda editar tareas de otros.
11. Comprueba la invalidación del token anterior al cambiar una contraseña; la cuenta debe poder entrar normalmente con la nueva.
12. Comprueba que el backend devuelva HTTP 429 después de 8 credenciales incorrectas para el mismo correo e IP; espera 15 minutos o reinicia el backend para limpiar la limitación del entorno de pruebas.

Si alguna prueba falla, conserva el mensaje completo de la consola (F12 o ventana de backend) y no reemplaces la instalación que ya funciona.
