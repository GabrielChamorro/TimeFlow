# Instalar y migrar TimeFlow V0.5.21-SNAPSHOT

Sprint 6 abierto. Actualización desde V0.5.20 con dos SQL aditivos. El directorio de trabajo puede conservar el nombre histórico V0.5.17; pom/package identifican V0.5.21. Aplicar frontend y backend juntos. Java 21, MySQL 8.4 y Node compatible con el lock (22.13+ compatible); no hay dependencias nuevas respecto a V0.5.20.

## Respaldo y preparación

1. Identificar servidor, puerto y base autorizados. Detener backend y todas las escrituras; no confiar solo en que no haya una ventana abierta.
2. Respaldar código/configuración privada y MySQL antes de DDL: mysqldump --single-transaction --quick --routines --triggers, con resultado fuera del proyecto/ZIP. Verificar código de salida, tamaño y SHA-256 y probar restauración en una instancia aislada.
3. Mantener secretos solo en configuración privada. La cuenta de migración necesita CREATE/ALTER/INDEX y permisos de respaldo; la de ejecución conserva permisos existentes y necesita SELECT/INSERT en tarea_registros. No necesita DDL ni borrar notas. ddl-auto sigue none.

## Migración desde V0.5.20

Ejecutar en la base seleccionada, con backend detenido, en este orden:

1. backend/sql/migracion_v0_5_21_registros.sql
2. backend/sql/migracion_v0_5_21_historial.sql

El primero crea registros; el segundo añade finalizada_en_ms e índices. Son aditivos/repetibles y no reescriben bitácoras ni inventan fechas. Las notas antiguas no se convierten en notas fechadas falsas. No hay migración automática destructiva al iniciar. Desde versiones anteriores a V0.5.19 aplicar primero sus migraciones documentadas; V0.5.20 no cambió el esquema de V0.5.19.

Asistente opcional PowerShell con respaldo previo:

```powershell
./scripts/Migrar_V0521.ps1 -MySqlExe 'C:/Program Files/MySQL/MySQL Server 8.4/bin/mysql.exe' -MySqlDumpExe 'C:/Program Files/MySQL/MySQL Server 8.4/bin/mysqldump.exe' -Database teamflow_db -DbHost 127.0.0.1 -Port 3306 -DbUser root -BackupDirectory 'C:/RespaldosPrivados/TimeFlow'
```

Ajustar TODOS los parámetros al entorno identificado. Esta ruta/puerto es un ejemplo de instalación, no fue ejecutado sobre la base personal. El asistente pide contraseña segura, no la guarda en archivos, respalda y verifica antes de migrar. MySQL DDL no es atómico entre scripts: si falla, mantener backend detenido, revisar y repetir los pasos idempotentes. El arnés de esta entrega usó solo loopback 33316 y esquemas sintéticos.

Instalación nueva: backend/sql/esquema_timeflow.sql incluye V0.5.21 y crea/selecciona teamflow_db; revisar ese nombre antes de ejecutar. Se comprobó dos veces en un esquema sintético nuevo. No importar dumps reales como fixtures de prueba.

## Compilar y arrancar

- Backend: detener cualquier JAR anterior; en backend ejecutar ./mvnw.cmd clean verify. Java 21. En paquete completo, java -jar bin/backend-0.5.21-SNAPSHOT.jar; desde fuentes, usar backend/target/backend-0.5.21-SNAPSHOT.jar.
- Frontend: npm ci, npm run test:sprint5, npm run build. Servir frontend/dist completo, incluidos worker/assets/licencias. Para desarrollo npm run dev.
- DB_URL, DB_USER, DB_PASSWORD y JWT_SECRET propios fuera del código. JWT_SECRET aleatorio de al menos 32 bytes. No reutilizar secretos sintéticos ni publicarlos.
- Desarrollo loopback: AUTH_LOCAL_HTTP=true, CORS_ALLOWED_ORIGINS con origen exacto del frontend; VITE_API_URL del mismo hostname, por ejemplo localhost en ambas partes. No mezclar localhost y 127.0.0.1. Backend enlaza a loopback por defecto.
- Producción: AUTH_LOCAL_HTTP=false, frontend/API HTTPS del mismo sitio, orígenes HTTPS exactos y proxy de confianza si existe. Mantener Secure, HttpOnly, CSRF, firma JWT y permisos. La prueba TLS local V0.5.20 no certifica producción.

Los clientes que crean tareas deben enviar nombre, meta y fechaLimite válida, sin confiar en antiguos valores de sustitución. PUT conserva version recibido; no incrementarlo en cliente. Al devolver de revisión a progreso, el administrador debe enviar motivoRechazo. Notas nuevas se agregan por POST de registros, no sustituyendo toda la bitácora.

Historial: fechas de cierre UTC, desde/hasta inclusivos por día; tareas antiguas sin timestamp se muestran sin fecha y no se incluyen al aplicar rango. Detalle y archivos siguen protegidos por propietario/administrador. No exponer API a LAN para solucionar errores de conexión.

## Recuperación segura

Con tráfico y backend detenidos, restaurar primero el respaldo en una base aislada. Comparar tareas, versiones, bitácoras, tarea_registros, dependencias y archivos. Antes de abrir un restore productivo, invalidar todas las familias de sesiones en la base restaurada (DELETE FROM sesiones_jwt; renovaciones se eliminan por cascada) y generar JWT_SECRET nuevo en configuración privada. Exigir login y comprobar rechazo de acceso/refresh antiguos. Nunca reabrir una copia antigua de sesiones con la clave vieja.

No borrar las tablas nuevas para revertir: preservan notas y motivos posteriores a la actualización. Preferir corregir y avanzar. Si se necesita volver temporalmente al backend anterior, mantener las escrituras detenidas y conservar íntegros respaldo y datos nuevos; restaurar un backup elimina cambios posteriores si no se reconcilian antes. No hay rollback destructivo automático. La restauración sintética de esta entrega conservó dos tareas y sus notas/rechazos; no certifica cada posible operación interrumpida ni login HTTP en la copia restaurada.

## Repetir pruebas

Backend: ./mvnw.cmd clean verify. Frontend: npm run test:sprint5, npm run build, npm run lint. No desactivar reglas ni borrar pruebas para aprobar.

scripts/probar_funcionalidades_v0521.py usa Python estándar e importa probar_sprint6.py. Solo entorno local desechable: TF_TEST_CONFIRM=TIMEFLOW_TEST_ONLY, TF_TEST_URL, TF_TEST_ADMIN_EMAIL, TF_TEST_ADMIN_PASSWORD, TF_TEST_USER_PASSWORD y TF_TEST_OUTPUT. Crea usuarios/tareas/notas sintéticos y no imprime secretos. La suite general probar_sprint6.py también carga archivos de límite: usar solo base aislada con espacio y max_allowed_packet adecuados. Probar sesiones requiere además TF_TEST_NEW_PASSWORD y TTL breve documentado en V0.5.20. Postman usa el entorno de ejemplo vacío, completado solo en privado.

Los ZIP excluyen dependencias descargadas, bases, backups y configuración privada. El delta es de fuentes respecto a V0.5.20: recompilar y reemplazar el dist completo, o usar el ZIP completo V0.5.21 con compilados. No mezclar dist viejo con el backend nuevo. Consultar PENDIENTES antes de considerar cierre.
