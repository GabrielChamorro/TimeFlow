# Instalar y probar TimeFlow V0.5.20-SNAPSHOT

Conservar un respaldo de código y base. El directorio original puede llamarse TimeFlowV0.5.17_Sprint6, pero pom/package identifican V0.5.20. El ZIP completo usa la carpeta TimeFlow_V0.5.20_Sprint6. No copiar target/node_modules de otra entrega.

## Actualizar desde V0.5.18

1. Detener backend y escrituras. No ejecutar migraciones sobre una base que no se haya identificado y respaldado.
2. Ejecutar desde PowerShell el asistente (rutas de ejemplo, ajustar):

```powershell
./scripts/Migrar_V0519.ps1 -MySqlExe 'C:/Program Files/MySQL/MySQL Server 8.4/bin/mysql.exe' -MySqlDumpExe 'C:/Program Files/MySQL/MySQL Server 8.4/bin/mysqldump.exe' -Database teamflow_db -DbUser root -Port 3306
```

Pide la contraseña sin guardarla en archivos, crea un dump completo y comprueba su resultado antes de migrar. Sus SQL se aplicaron realmente en 33316; el asistente completo solo tuvo validación de sintaxis. Si falla un paso, mantener backend detenido: MySQL DDL no es atómico entre todos los scripts. Corregir y repetir los scripts idempotentes. No restaurar ni borrar automáticamente tablas.

Alternativa manual: mysqldump --single-transaction --quick --routines --triggers con un usuario autorizado y --result-file fuera del código. Verificar salida, tamaño y SHA-256. Seleccionar la base correcta y ejecutar en orden backend/sql/migracion_v0_5_19_sesiones.sql, tareas.sql, renovacion.sql, usuarios.sql y tipos.sql. Los dos primeros pueden existir de la sesión interrumpida: repetirlos es seguro. El esquema completo incluye esos cambios para instalaciones nuevas.

3. Conservar secretos propios fuera de ZIP/Git. La cuenta de ejecución requiere CRUD sobre sesiones_jwt y renovaciones_jwt, además de sus permisos anteriores. La cuenta que migra requiere CREATE/ALTER y permisos para el respaldo. ddl-auto permanece none.
4. Instalar el backend y frontend juntos. PUT de tareas/usuarios/tipos debe incluir el campo version recibido del servidor; nunca inventar ni incrementar la versión en el cliente. Ante 409 revisar el registro reciente y conservar el borrador. JWT de V0.5.18 requieren login nuevo una sola vez.

## Desarrollo local con puertos distintos

Java 21, MySQL 8.4 y Node/npm compatibles con las versiones existentes. V0.5.20 incorpora PDF.js 6.5.438; usar npm ci con el lock incluido.

Configurar variables privadas DB_URL, DB_USER, DB_PASSWORD, JWT_SECRET (al menos 32 bytes aleatorios). No imprimirlas. Para localhost:

```text
AUTH_LOCAL_HTTP=true
CORS_ALLOWED_ORIGINS=http://localhost:5173
JWT_EXPIRATION_MS=300000
REFRESH_EXPIRATION_MS=2592000000
```

Frontend: VITE_API_URL=http://localhost:8080. Vite fija esta URL al compilar; reconstruir al cambiarla. Usar localhost en ambas partes; si se usa 127.0.0.1, usarlo también en API/orígenes. SameSite=Strict no permite mezclar esos hostnames. Los puertos pueden diferir. El lanzador iniciar_servidor.bat habilita HTTP local si no se indicó otro modo; la validación impide usar ese modo fuera de loopback. No reemplaza configuración de producción.

Compilar backend con ./mvnw.cmd clean verify en backend. Arrancar java -jar bin/backend-0.5.20-SNAPSHOT.jar desde la raíz del paquete completo, o usar el JAR generado en backend/target. En frontend: npm ci, npm run build y npm run dev. No se distribuye node_modules.

## Producción

AUTH_LOCAL_HTTP=false; frontend y API HTTPS del mismo sitio, con orígenes HTTPS exactos en CORS_ALLOWED_ORIGINS. Sin comodines ni Origin null. La cookie usa Secure y HttpOnly. Si TLS termina en proxy, configurar forwarded headers únicamente con un proxy de confianza que reemplace cabeceras entrantes; no confiar en X-Forwarded-* de Internet. Verificar el HTTPS del despliegue antes de habilitar usuarios; la prueba local de auditoría no lo certifica. No se probó un despliegue productivo.

No se envían cookies a las API de datos. Login/refresh/logout usan credentials: include, Origin y X-TimeFlow-CSRF: 1. Las demás llamadas usan Bearer y credentials: omit. Cookies host-only, sin Domain, Path=/api/auth y SameSite=Strict. No se cambian cookies a SameSite=None para sortear configuraciones cross-site.

El acceso vence en 5 minutos y la sesión absoluta en 30 días por defecto; REFRESH_EXPIRATION_MS máximo 30 días. Recargar restaura desde la renovación, sin localStorage. Salir borra cookie y revoca la familia. Cambiar contraseña/correo/rol o desactivar cuenta revoca sus sesiones. Restaurar un backup antiguo exige rotar JWT_SECRET y vaciar registros de sesiones antes de abrir accesos, para no resucitar revocaciones antiguas.

## Pruebas

- frontend: npm run test:sprint5, npm run build, npm run lint.
- backend: ./mvnw.cmd clean verify. Se conservaron todas las pruebas anteriores.
- scripts/probar_sesiones_v0519.py: solo instancia local desechable. Requiere TF_TEST_CONFIRM=TIMEFLOW_TEST_ONLY, TF_TEST_URL, TF_TEST_ORIGIN, TF_TEST_ADMIN_PASSWORD, TF_TEST_USER_PASSWORD y TF_TEST_NEW_PASSWORD. Para el caso de expiración usar JWT_EXPIRATION_MS breve y TF_TEST_ACCESS_WAIT_SECONDS mayor que ese valor en segundos. La prueba pública no reinicia procesos; la evidencia de reinicio proviene del arnés aislado de esta auditoría.
- scripts/probar_sprint6.py: entorno local desechable y TF_TEST_USER_PASSWORD; valida la regresión funcional incluyendo cinco archivos reales de 60 MiB. Requiere max_allowed_packet suficiente y espacio. Nunca usar una base personal.
- scripts/probar_concurrencia_mysql_sprint6.py: requiere también TF_TEST_DB_PASSWORD y cliente MySQL. Rechaza puerto 3306; comprueba cuota y edición obsoleta con bloqueo real.
- Postman: importar scripts/postman/timeflow_sprint6.postman_collection.json y el entorno de ejemplo vacío. Completar datos solo en el entorno privado. test_origin debe estar autorizado. No exportar entornos con secretos.

Las cuentas y datos sintéticos se conservan para inspección en el entorno de prueba; no se incluyen sus credenciales ni bases en esta entrega. RESULTADOS distingue pruebas ejecutadas de las pendientes.


## Actualización desde V0.5.19 y mantenimiento V0.5.20

Desde V0.5.19 no hay cambios de esquema: no se necesita migración nueva. Conservar las cinco migraciones V0.5.19 para instalaciones anteriores; sus nombres y Migrar_V0519.ps1 son correctos. Respaldar antes de actualizar y aplicar backend y frontend juntos. Requiere Java 21 y Node 22.13 o superior compatible con Vite/PDF.js; npm ci usa el lock. Worker PDF se sirve del mismo build, sin CDN; incluir dist/assets y dist/licenses completos y permitir worker-src 'self' si se configura CSP.

Limpieza de sesiones: propiedad app.sessions.cleanup-ms, 900000 ms por defecto, elimina hasta 1000 familias caducadas cada vez. El usuario SQL de ejecución necesita DELETE sobre sesiones y renovaciones según permisos existentes; no necesita DDL. La FK limpia renovaciones. Supervisar advertencias y crecimiento; no borrar tokens usados de familias vigentes: se necesitan para detectar reutilización.

Procedimiento de restauración (con backend y tráfico detenidos): verificar backup y destino aislado; restaurar y comprobar tablas/relaciones; ejecutar DELETE FROM sesiones_jwt en la BD restaurada (cascada renovaciones); generar JWT_SECRET nuevo y guardarlo solo en configuración privada; arrancar backend con la nueva clave; exigir nuevo login y verificar que acceso/refresh anteriores fallan. Nunca reabrir con filas de sesión del backup y clave vieja. El dump sintético de esta auditoría no se distribuye.

HTTPS local se probó con TLS directo y certificado efímero validado solo por cliente de pruebas. No se distribuyen certificado privado, password PKCS12 ni claves del arnés. Para producción usar certificado válido y su configuración propia; no deshabilitar verificación ni aceptar cabeceras de proxy no confiables.

El limitador sigue en memoria por proceso. No usar su prueba de 32 hilos como certificación distribuida. Ver PENDIENTES_V0.5.20.md antes de exponer servicio o cerrar sprint.
