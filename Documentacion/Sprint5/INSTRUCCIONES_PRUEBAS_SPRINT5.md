# Cómo probar el Sprint 5 (Windows)

1. **Respaldar** `teamflow_db` y copiar V0.5.0 estable antes de tocar el equipo de pruebas.
2. Copiar **únicamente los archivos del parche** dentro del repositorio local y revisar `git status`. No mezclar varias carpetas TimeFlow dentro de otra.
3. Instalar las dependencias del frontend como de costumbre. En `frontend` ejecutar `npm ci`, `npm run test:sprint5` y `npm run build`. Registrar salida y fallos.
4. En `backend` ejecutar `mvnw.cmd test`. Comparar con las 37 pruebas JUnit aprobadas del Sprint 4. Las dos pruebas S5 nuevas deben pasar también.
5. Arrancar los servidores con las credenciales locales habituales; no guardar claves ni JWT en Git.
6. Probar monitoreo real, arrastrar tareas y guardar la posición; salir y volver a entrar. Abrir tarea desde mapa con Enter y espacio.
7. Para la **demo sin escritura en MySQL**, ejecutar `npm run dev` y abrir `http://localhost:5173/?demoSprint5=100`, iniciar sesión y seleccionar Monitoreo. Verificar conteo 100, zoom, pan, filtro, botón Encajar nodos y navegación de teclado. La demo permite abrir detalles ficticios en modo solo lectura, sin opciones de edición. Selecciona distintos nodos con clic, Enter y espacio, comprueba los datos, cierra con el botón, clic en el fondo y Escape. Confirma que no se pueden editar ni borrar y que no aparecen registros `DEMO-` en MySQL.
8. Abrir Chrome, Edge y Firefox. Registrar ancho/alto de pantalla, resultados, problemas de usabilidad y FPS real usando herramientas de rendimiento del navegador. No confundir benchmark de Node con FPS.
9. Probar chat con dos cuentas activas en dos navegadores o perfiles. Enviar mensaje desde una y comprobar que aparezca en la otra sin recargar, en un máximo aproximado de 30 segundos mientras el chat esté visible. Verificar no filtrar mensajes directos ajenos.
10. Medir API con datos de prueba y JWT temporal. Desde la raíz ejecutar `powershell -ExecutionPolicy Bypass -File .\scripts\PROBAR_RENDIMIENTO_API_SPRINT5.ps1 -Endpoint tareas -Requests 100 -Concurrency 5 -Output .\tiempos_tareas.csv`. El script solicita el JWT sin mostrarlo cuando no hay variable de entorno. **No subir** el token ni un CSV con datos sensibles al repositorio.
11. Para pruebas de concurrencia de escrituras, crear base de datos desechable y casos de prueba con limpieza. El script GET no comprueba carreras de escritura ni integridad transaccional.
12. Si hace falta, aplicar `backend/sql/optimizacion_sprint5_indices_mensajes.sql` *solo después* de backup, y comparar tiempos antes/después. No ejecutar sobre datos productivos sin plan de rollback.
13. Repetir pruebas Postman de V0.5.0 (15/15 y 60/60), OWASP, pruebas JUnit, escenarios de seguridad 401/403 y recorrido funcional. En la prueba 31 de Postman, revisar manualmente el mensaje `No response` observado en la versión base.

**Criterios de cierre:** pruebas reales del mapa con 100 nodos, tiempos y concurrencia medidos, compatibilidad revisada y regresiones descartadas. Hasta entonces Sprint 5 está en desarrollo.
