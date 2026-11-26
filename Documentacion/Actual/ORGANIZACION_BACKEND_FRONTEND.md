# Organización de backend y frontend — TimeFlow V0.5.23

Se agruparon **15 archivos auxiliares**, manteniendo el proyecto
completo, el código, la configuración principal, los SQL y los archivos de
arranque en sus ubicaciones originales.

### Uso normal
1. `INSTALAR_DEPENDENCIAS_TIMEFLOW.bat`
2. `backend/iniciar_servidor.bat`
3. `frontend/iniciar_servidor.bat`

### Archivos internos
- `backend/interno/`: verificaciones de Java/MySQL, esquema, elevación y
  configuración de instalación. No ejecutar de manera manual.
- `backend/herramientas/`: auditoría Maven/OWASP, pruebas y documentos de apoyo.
- `frontend/interno/`: búsqueda segura de Node.js y npm.

**Sin nuevas migraciones de MySQL.** No se modificó el backend Java, el
frontend React, los SQL ni el JAR. Sí se actualizaron las rutas usadas por
los BAT y algunos documentos para mantener sus funciones desde las nuevas carpetas.

Nota: comprobación de archivos y referencias realizada; no se ejecutaron
los BAT en Windows en este entorno.
