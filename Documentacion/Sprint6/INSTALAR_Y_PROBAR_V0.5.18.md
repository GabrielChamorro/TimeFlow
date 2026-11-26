# Instalar y probar V0.5.18-SNAPSHOT

Esta candidata mantiene Sprint 6 abierto. Utilice frontend y backend V0.5.18 juntos: el movimiento manual requiere ahora `anteriorX` y `anteriorY` (incluidos null). Un cliente anterior recibirá 400 si omite esas propiedades; 409 significa que otra sesión cambió la posición y debe recargar.

## Instalación y recuperación

1. Conserve la carpeta V0.5.17 y un respaldo MySQL antes de reemplazar la aplicación. Mantenga `config_local.bat`, las credenciales y JWT_SECRET fuera de ZIP/repositorios. No copie una base real al entorno de pruebas.
2. Requisitos comprobados: Java 21, MySQL 8.4 y Node 24.22.1/npm 11.19.1. El wrapper descarga Maven. Para otra versión de Node, respete el campo engines de Vite y verifique de nuevo.
3. V0.5.18 **no necesita nueva migración** sobre una instalación V0.5.17 preparada. Para una instalación vacía use `backend/sql/esquema_timeflow.sql`. Si proviene de antes de V0.5.8, siga su actualizador con respaldo y backend detenido; no omita la migración de dependencias.
4. Configure DB_URL, DB_USER, DB_PASSWORD y JWT_SECRET mediante el mecanismo local existente. Para una base vacía, indique INITIAL_ADMIN_EMAIL e INITIAL_ADMIN_PASSWORD seguros. JWT_SECRET debe ser aleatorio y tener al menos 32 bytes; no use claves de los tests. Contraseñas: 8–64 caracteres, letra/número y máximo 72 bytes UTF-8.
5. Verifique `SHOW VARIABLES LIKE 'max_allowed_packet';` en la instancia elegida. Las pruebas de 60 MiB utilizaron 128 MiB. No se cambió la configuración del MySQL existente. La aplicación conserva los archivos desactivados dentro de la cuota de 300 MiB y 25 archivos.
6. Compile desde cada carpeta:

```powershell
# frontend
npm ci
npm run test:sprint5
npm run build
npm run lint

# backend
.\mvnw.cmd clean verify
```

No tenga Vite activo durante `npm ci` ni el JAR activo durante `clean`: Windows bloquea esos binarios y la operación falla. Detenga solo los procesos de esa instalación y vuelva a ejecutar; no omita pruebas.

Ejecute el JAR construido con Java 21: `java -jar backend/target/backend-0.5.18-SNAPSHOT.jar` desde la raíz, con el entorno configurado. En el ZIP completo se incluye además el binario verificado bajo `bin/`; puede usar `java -jar bin/backend-0.5.18-SNAPSHOT.jar`. El ZIP de cambios contiene fuentes y evidencias, sin repetir el binario. Compare su SHA-256 con el manifiesto de entrega.

En frontend, copie si hace falta `conexion_backend.env` a `.env.local` y ajuste VITE_API_URL a la **URL base sin `/api`**, por ejemplo `http://localhost:8080`. Configure CORS_ALLOWED_ORIGINS con el origen exacto de Vite. Las variables VITE se incorporan al build; reconstruya si cambia la URL. La API escucha en 127.0.0.1 por defecto.

Para volver a V0.5.17, detenga ambas partes y restaure la carpeta respaldada; los cambios V0.5.18 no alteran el esquema. No borre datos. Si hubo una migración anterior durante su instalación, utilice su respaldo y procedimiento de recuperación propios antes de volver a una versión incompatible.

## Integración reproducible en una instancia desechable

Las pruebas de esta entrega usaron MySQL independiente en **127.0.0.1:33316**, backend en **18086** y frontend en **15176**. Son puertos de ejemplo de pruebas. No apunte los scripts a producción. La instancia debe tener el esquema, una cuenta administradora sintética y capacidad de almacenar al menos 300 MiB; cada repetición conserva nuevos registros de prueba.

En PowerShell, establezca estas variables con los valores de su propio entorno sintético; nunca los confirme en Git:

```powershell
$env:TF_TEST_CONFIRM='TIMEFLOW_TEST_ONLY'
$env:TF_TEST_URL='http://127.0.0.1:18086'
$env:TF_TEST_ADMIN_EMAIL='admin@sprint6.test'
# TF_TEST_ADMIN_PASSWORD: contraseña del administrador de su base de pruebas
$env:TF_TEST_OUTPUT='Evidencias/Sprint6/V0.5.18/integracion-local.json'
$env:TF_TEST_CONTEXT='contexto-local-privado.json'
python scripts/probar_sprint6.py
```

El contexto opcional contiene una contraseña **sintética** para continuar con Postman. Manténgalo fuera de la distribución y elimínelo cuando deje de usar la instancia. El script exige confirmación textual y localhost, pero esa barrera no identifica por sí sola una base de producción: usted debe seleccionar un entorno desechable.

Para reproducir las dos carreras, configure además TF_TEST_DB_PASSWORD, TF_TEST_DB_PORT=33316, TF_TEST_DB_USER y, si corresponde, TF_TEST_MYSQL con la ruta de mysql.exe. `python scripts/probar_concurrencia_mysql_sprint6.py` conserva 24 archivos, bloquea brevemente una fila en la base de pruebas y envía dos solicitudes simultáneas; comprueba 201/400 y 25 archivos. Después reproduce edición concurrente con movimiento y exige que se conserven ambos cambios. El script rechaza el puerto 3306.

## Postman y dependencias

Importe `scripts/postman/timeflow_sprint6.postman_collection.json` y el entorno de ejemplo. Complete las variables con el contexto sintético de `probar_sprint6.py`: `workerEmail` → worker_email, `workerPassword` → worker_password, `workerId` → worker_id, `taskA/B/C` → task_a/b/c y `template` → template_id. Indique también admin_email, admin_password y base_url. No exporte tokens ni contraseñas a un paquete público.

Con Newman instalado en una carpeta de herramientas independiente:

```powershell
newman run scripts/postman/timeflow_sprint6.postman_collection.json -e entorno-local-privado.json --reporters cli
```

Ejecute `npm audit --json` en frontend. Para OWASP use el script existente `backend/interno/_EJECUTAR_OWASP_NVD.ps1` y proporcione una clave NVD cuando se solicite. Un análisis con `-ReuseLocalNvd` solo comprueba la caché, no los avisos actuales. No se distribuya la clave ni se suprima un fallo para declarar aprobación.

## Comprobación manual pendiente de aceptación completa

Revise las definiciones originales de US-01…US-23 y RNF-1…RNF-5, hoy ausentes. Repita con dos administradores, documentos propios de prueba, cambios de red y navegadores objetivo. En mapa: vista previa, Cancelar, Aplicar, recarga, arrastre y conflicto 409. En administración: tres confirmaciones de cuentas y dos de tipos, texto incorrecto, recuperación e historial. Un 503 durante indisponibilidad de MySQL debe permitir reintentar cuando vuelva el servicio. La vista PDF protegida puede requerir descargar el documento.

Los resultados de referencia están en `RESULTADOS_V0.5.18.md` y `Evidencias/Sprint6/V0.5.18/`. Los pendientes y riesgos están en `AUDITORIA_V0.5.18.md`; no son criterios aprobados.
