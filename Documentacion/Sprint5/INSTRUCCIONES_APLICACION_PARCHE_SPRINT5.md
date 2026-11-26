# Aplicar TimeFlow Sprint 5 en tu repositorio GitHub

**Estado de esta entrega:** Sprint 5 en desarrollo, código candidato 0.5.1-SNAPSHOT.
No se trata de una versión final probada en Windows. Conserva el backup estable de V0.5.0.

1. Haz una copia de la carpeta de TimeFlow V0.5.0 que ya tienes en Git.
2. Abre el ZIP del parche. Las rutas empiezan en `backend/`, `frontend/`, `scripts/`, `Documentacion/` y `Evidencias/`.
3. Extrae **el contenido del ZIP** dentro de la raíz del repositorio local TimeFlow, donde están `backend` y `frontend`. Permite reemplazar los archivos de código afectados. No borres ni reemplaces tus otras carpetas de evidencias.
4. Abre PowerShell desde la raíz y ejecuta `git status`. La lista de archivos modificados debe corresponder a esta actualización.
5. Para validar Java: desde `backend`, ejecutar `.\mvnw.cmd test` (requiere Java 21 y dependencias Maven).
6. Para validar React: desde `frontend`, ejecutar `npm ci`, `npm run test:sprint5` y `npm run build`.
7. Para probar 100 nodos de demostración sin alterar la base de datos, iniciar Vite con `npm run dev`, abrir `http://localhost:5173/?demoSprint5=100`, iniciar sesión y entrar al mapa.
8. Para medir servicios sin escribir: ver `Documentacion/Sprint5/INSTRUCCIONES_PRUEBAS_SPRINT5.md`.
9. Si todas las comprobaciones son correctas, realizar commit:

```
git add backend frontend scripts Documentacion/Sprint5 Evidencias/Sprint5
git status
git diff --cached --name-only
git commit -m "feat: iniciar Sprint 5 TimeFlow con mejoras de mapa y consultas"
git push origin main
```

## Archivos SQL

El archivo `backend/sql/optimizacion_sprint5_indices_mensajes.sql` se ejecuta **manualmente** y solamente después de respaldar `teamflow_db`. No hay ninguna migración automática de la base de datos en el parche.

## Notas

No se incluyen contraseñas, tokens, dump de datos ni archivos de configuración local. El `.gitignore` que ya tengas en el repositorio debe conservarse. Revisa igualmente los archivos antes del commit.
**No marcar Sprint 5 como finalizado** hasta repetir pruebas JUnit/Postman, rendimiento, seguridad y compatibilidad de navegadores reales.
