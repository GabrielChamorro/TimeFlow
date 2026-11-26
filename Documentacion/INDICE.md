# Índice de archivos — TimeFlow V0.5.23

La carpeta principal contiene únicamente los elementos necesarios para
instalar e iniciar TimeFlow, además del README y `.gitignore`.

- `INSTALAR_DEPENDENCIAS_TIMEFLOW.bat`: instalador único; comprueba las dependencias ya disponibles.
- `backend/iniciar_servidor.bat`: inicia el backend.
- `frontend/iniciar_servidor.bat`: inicia el frontend.
- `Documentacion/Actual/`: documentos de la entrega actual e instalación.
- `Documentacion/Historial/Cambios/`: registros de cambios de versiones anteriores.
- `Documentacion/Historial/Entregas/`: informes de entregas anteriores.
- `Documentacion/Historial/Pruebas/`: pruebas y resultados históricos.
- `Documentacion/Historial/Guias/`: instrucciones antiguas e inventarios.
- `Documentacion/Prototipos/`: maquetas HTML históricas que no forman parte de la aplicación.
- `scripts/historicos/`: scripts de mantenimiento de versiones antiguas.
- `Documentacion/Sprint5/`, `Documentacion/Sprint6/`, `Evidencias/`: documentación y evidencias originales.

**La aplicación no fue modificada**: el backend, el frontend, el JAR,
las migraciones, el instalador principal y los dos iniciadores conservan
exactamente su contenido original. Solo se reorganizó documentación y se
ajustaron las rutas internas de scripts históricos para su nueva ubicación.

No utilices los scripts de migración históricos para instalar V0.5.23:
el instalador principal ya gestiona la base de datos.

## Carpetas de backend y frontend

Para facilitar la lectura, en `backend/` se agruparon los verificadores y
auxiliares de instalacion en `backend/interno/`, y las herramientas de
desarrollo, auditoria y documentacion auxiliar en `backend/herramientas/`.
En `frontend/`, la deteccion de Node se encuentra en `frontend/interno/`.

No necesitas abrir esos auxiliares para instalar o usar TimeFlow. Conserva
los archivos en sus carpetas: los iniciadores y el instalador los encuentran
por sus rutas actualizadas.
