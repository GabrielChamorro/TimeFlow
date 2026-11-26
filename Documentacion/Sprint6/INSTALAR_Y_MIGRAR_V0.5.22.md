# Instalar y migrar directamente de TimeFlow V0.5.19 a V0.5.22

Sprint 6 abierto. Instalar frontend y backend V0.5.22 juntos. El ZIP completo incluye fuentes, frontend/dist y bin/backend-0.5.22-SNAPSHOT.jar. El directorio de trabajo puede conservar su nombre histórico V0.5.17; pom/package identifican V0.5.22. Java 21, MySQL 8.4 y Node compatible con el lock del proyecto. No hay dependencias nuevas respecto a V0.5.21.

## Respaldo y orden de migración

La base del usuario ya está en V0.5.19. No necesita instalar V0.5.20 ni V0.5.21 ni ejecutar sus aplicaciones. V0.5.20 no añadió esquema. Con backend y escrituras detenidos, identificar servidor/puerto/base y respaldar MySQL y configuración privada fuera del proyecto antes de ejecutar DDL.

Aplicar estos TRES SQL, en la base seleccionada y en este orden:

1. backend/sql/migracion_v0_5_21_registros.sql
2. backend/sql/migracion_v0_5_21_historial.sql
3. backend/sql/migracion_v0_5_22_tiempos.sql

Si la base ya tiene V0.5.21, solo necesita el tercero; repetir los tres también es seguro. Se probaron ambos esquemas exactos entregados, instalación limpia y ejecuciones dobles. Los SQL conservan filas y bitácoras. Tiempo y cierre históricos desconocidos quedan NULL; no se calculan desde una hora HH:mm. ddl-auto sigue none.

La cuenta de migración necesita permisos existentes de respaldo y CREATE/ALTER/INDEX. La de ejecución no necesita DDL y debe poder SELECT/INSERT registros de tareas, además de sus permisos operativos previos sobre tareas/jornadas/usuarios/evidencias. No compartir ni publicar credenciales.

Helper PowerShell opcional, incluido tanto en ZIP completo como en Migraciones:

```powershell
./scripts/Migrar_V0522.ps1 -MySqlExe 'C:/Program Files/MySQL/MySQL Server 8.4/bin/mysql.exe' -MySqlDumpExe 'C:/Program Files/MySQL/MySQL Server 8.4/bin/mysqldump.exe' -Database teamflow_db -DbHost 127.0.0.1 -Port 3306 -DbUser root -BackupDirectory 'C:/RespaldosPrivados/TimeFlow'
```

Ajustar los parámetros al entorno autorizado; son ejemplos de instalación, no comandos ejecutados sobre la base personal. El helper pide SecureString, conserva la configuración de MYSQL_PWD previa, crea dump completo con --single-transaction --quick --routines --triggers y comprueba salida/tamaño antes del primer SQL. Emite SHA-256 y no guarda contraseña. Si falla el respaldo, no migra. El DDL de MySQL no forma una única transacción entre scripts: mantener backend detenido, revisar y repetir los pasos idempotentes si hay error.

Se ejecutó realmente dos veces sobre un esquema V19 sintético de 33316; se comprobó que el primer respaldo aún no contenía las columnas nuevas, se restauró y se migró sin pérdida. No se probó un corte abrupto ni login HTTP del esquema restaurado.

Instalación NUEVA: backend/sql/esquema_timeflow.sql incluye todo V22 y crea/selecciona teamflow_db; revisar ese nombre antes de ejecutar. No usarlo como sustituto de las migraciones sobre una base personal existente. No importar respaldos personales como fixtures.

## Compilar y arrancar

- Backend: detener cualquier JAR anterior; en backend ejecutar ./mvnw.cmd clean verify. Java 21. En paquete completo, java -jar bin/backend-0.5.22-SNAPSHOT.jar; desde fuentes, usar backend/target/backend-0.5.22-SNAPSHOT.jar.
- Frontend: npm ci, npm run test:sprint5, npm run build. Servir frontend/dist completo, incluidos worker/assets/licencias. Para desarrollo npm run dev.
- DB_URL, DB_USER, DB_PASSWORD y JWT_SECRET propios fuera del código. JWT_SECRET aleatorio de al menos 32 bytes. No reutilizar secretos sintéticos ni publicarlos.
- Desarrollo loopback: AUTH_LOCAL_HTTP=true, CORS_ALLOWED_ORIGINS con origen exacto del frontend; VITE_API_URL del mismo hostname, por ejemplo localhost en ambas partes. No mezclar localhost y 127.0.0.1. Backend enlaza a loopback por defecto.
- Producción: AUTH_LOCAL_HTTP=false, frontend/API HTTPS del mismo sitio, orígenes HTTPS exactos y proxy de confianza si existe. Mantener Secure, HttpOnly, CSRF, firma JWT y permisos. La prueba TLS local V0.5.20 no certifica producción.

Los clientes que crean tareas deben enviar nombre, meta y fechaLimite válida, sin confiar en antiguos valores de sustitución. PUT conserva version recibido; no incrementarlo en cliente. Al devolver de revisión a progreso, el administrador debe enviar motivoRechazo. Notas nuevas se agregan por POST de registros, no sustituyendo toda la bitácora.

Historial: fechas de cierre UTC, desde/hasta inclusivos por día; tareas antiguas sin timestamp se muestran sin fecha y no se incluyen al aplicar rango. Detalle y archivos siguen protegidos por propietario/administrador. No exponer API a LAN para solucionar errores de conexión.

## Recuperación segura

Con tráfico y backend detenidos, restaurar primero el respaldo en una base aislada. Comparar tareas, versiones, bitácoras, tarea_registros, dependencias y archivos. Antes de abrir un restore productivo, invalidar todas las familias de sesiones en la base restaurada (DELETE FROM sesiones_jwt; renovaciones se eliminan por cascada) y generar JWT_SECRET nuevo en configuración privada. Exigir login y comprobar rechazo de acceso/refresh antiguos. Nunca reabrir una copia antigua de sesiones con la clave vieja.

No borrar las tablas nuevas para revertir: preservan notas y motivos posteriores a la actualización. Preferir corregir y avanzar. Si se necesita volver temporalmente al backend anterior, mantener las escrituras detenidas y conservar íntegros respaldo y datos nuevos; restaurar un backup elimina cambios posteriores si no se reconcilian antes. No hay rollback destructivo automático. La restauración sintética comprobó un respaldo V19 y su actualización a V22, con legado Unicode intacto; no certifica cada posible operación interrumpida ni login HTTP en la copia restaurada.

## Repetir pruebas

Backend: ./mvnw.cmd clean verify. Frontend: npm run test:sprint5, npm run build, npm run lint. No desactivar reglas ni borrar pruebas para aprobar.

scripts/probar_funcionalidades_v0521.py y scripts/probar_funcionalidades_v0522.py usan Python estándar e importa probar_sprint6.py. Solo entorno local desechable: TF_TEST_CONFIRM=TIMEFLOW_TEST_ONLY, TF_TEST_URL, TF_TEST_ADMIN_EMAIL, TF_TEST_ADMIN_PASSWORD, TF_TEST_USER_PASSWORD y TF_TEST_OUTPUT. Crea usuarios/tareas/notas sintéticos y no imprime secretos. La suite general probar_sprint6.py también carga archivos de límite: usar solo base aislada con espacio y max_allowed_packet adecuados. Probar sesiones requiere además TF_TEST_NEW_PASSWORD y TTL breve documentado en V0.5.20. Postman usa el entorno de ejemplo vacío, completado solo en privado.

Los ZIP excluyen dependencias descargadas, bases, backups y configuración privada. El delta es de fuentes respecto a V0.5.21: recompilar y reemplazar el dist completo, o usar el ZIP completo V0.5.22 con compilados. No mezclar dist viejo con el backend nuevo. Consultar PENDIENTES antes de considerar cierre.

## Nuevas reglas y actualización

Los cronómetros nuevos son por tarea/estado, independientes de la jornada. Acumulan en En Progreso; revisión, finalización y baja detienen. Rechazo/reactivación reanudan sin contar la pausa. Las tareas antiguas sin timestamps no reciben duraciones ficticias. GET de sincronización calibra contra el servidor; no escribir los campos de reloj desde el cliente.

Presencia del mapa y sincronización consultan cada 5 s. Tareas completas se vuelven a solicitar solo al detectar cambios de IDs/versiones; notas por su marcador. Una actualización periódica puede tardar un intervalo más la red y puede ser limitada en pestañas de fondo. No sustituir permisos/cookies/CSRF para acelerar pruebas.

El delta compara fuentes contra V0.5.21 y requiere recompilar JAR y dist; el ZIP completo ya incluye compilados. Desde V0.5.19 usar directamente el ZIP completo V0.5.22 más las tres migraciones anteriores. Verificar TODOS los hashes del manifiesto, incluido LEEME_ENTREGA.md; no mezclar copias de otras entregas.
