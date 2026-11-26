# Auditoría de TimeFlow V0.5.20-SNAPSHOT

Corte: 15 de noviembre de 2026, America/Santiago. Candidata construida directamente sobre las fuentes V0.5.19 entregadas. Sprint 6 abierto; no es versión estable ni certificación de producción. La copia no tiene Git; los cambios se comparan con SHA-256 del ZIP V0.5.19 inmutable.

## Correcciones realizadas

1. **PDF protegido vacío.** Se reemplaza el iframe del visor nativo por PDF.js 6.5.438 cargado de forma diferida, worker local y dibujo en canvas. Se comprobó contenido visible del PDF sintético; captura `pdf-canvas.jpg`. No se incorpora el viewer ni su subsistema de scripting, anotaciones HTML o enlaces del PDF. XFA/Wasm deshabilitados, imágenes/canvas acotados, escalado máximo de 2400 px por lado y 8 millones de píxeles. La descarga queda disponible. Un límite de error del componente evita que un fallo del visor/importación deje toda la aplicación en blanco. El uso de canvas no demuestra resistencia a todo PDF malicioso ni a agotamiento arbitrario de CPU; queda pendiente un corpus hostil y archivos complejos.
2. **Carrera en el limitador de login.** La comprobación anterior y el registro del fallo eran operaciones separadas: solicitudes paralelas podían entrar a BCrypt antes de consumir intentos. Ahora `admitir` reserva atómicamente los contadores antes de validar; el éxito libera su reserva IP y limpia el par. Una prueba con 32 hilos admite exactamente 8; 100 éxitos consecutivos no provocan bloqueo IP. Se conservan límites existentes y respuestas sin revelar cuentas. No se introducen Redis ni tablas nuevas.
3. **Mantenimiento.** Limpieza programada cada 15 minutos, DELETE indexado por vencimiento y limitado a 1000 familias por ejecución; renovaciones desaparecen por FK ON DELETE CASCADE. Ante error SQL se registra advertencia genérica y se reintenta después. Prueba real con periodo de 1 s: expirada eliminada, vigente conservada. Si se crean más de 1000 familias caducadas por intervalo, ajustar operación/capacidad y vigilar retraso; no se promete limpieza instantánea.
4. **Lint y estabilidad.** Se mueven los efectos de sesión después de inicializar estados y referencias usados por sus callbacks; se corrigen dependencias de efectos de evidencias, se valida que la lista recibida sea un arreglo, se separan utilidades de EvidenceDropzone y se estabiliza loadUsers mediante useCallback. No se apagan reglas. Persisten advertencias que requieren revisar animaciones y sincronización de formularios; ver log final.

## Sesiones y concurrencia

Se mantienen JWT breve en memoria, restauración mediante refresh HttpOnly persistente, rotación, revocación MySQL, firma, permisos, CSRF y CORS exacto. F5 comprobado en IAB sin perder usuario/rol. Otra pestaña del mismo perfil recupera la sesión y se cierra la anterior. Logout seguido de recarga termina en login. Esto NO prueba cerrar todas las pestañas sin otra viva ni reiniciar el proceso completo de Chrome/Edge.

38 comprobaciones nuevas de sesiones con cookies independientes: login, restauración equivalente a F5, expiración de acceso, renovación, 200/409 concurrente, reutilización vieja y revocación familiar, contraseña, baja/reactivación y reinicio real del backend. No confundir nuevo cliente HTTP con reinicio de navegador.

Conflictos: 27 comprobaciones de tareas, 20 de cuentas y 18 de tipos. Dos administradores HTTP autenticados independientes compiten desde la misma versión: un guardado 200, otro 409; revisión y reintento, bajas/roles, conservación de bitácora/dependencias/posición y movimiento concurrente. Los flujos UI de V0.5.19 permanecen como antecedentes. Falta repetir el protocolo completo en **dos interfaces con perfiles independientes** en esta candidata. Las pestañas IAB comparten cookies; no se presentan como dos administradores independientes.

Chrome y Edge están instalados. Se preparó perfil desechable de Chrome, pero el permiso de control de aplicación de la herramienta no se habilitó antes de expirar. No se sorteó mediante otro mecanismo de automatización. No se cerraron procesos o perfiles personales.

## HTTPS real aislado

Se inició el JAR con TLS directo en 18087, certificado efímero SAN localhost/127.0.0.1 y clave privada exclusivamente en el arnés privado. El cliente confía solo ese certificado y verifica cadena y hostname: no se usa verify=false ni se cambia la confianza del sistema. Login, API Bearer, refresh con rotación, Secure/HttpOnly/Strict, CSRF y logout aprobados. No hubo proxy; no se aceptaron cabeceras Forwarded de clientes ni se certificó un proxy productivo. Falta probar el despliegue y certificados reales de producción. `https-y-limpieza.json` contiene 10 verificaciones, incluida limpieza.

## Archivos y recuperación

Se conservaron 60 MiB por archivo, 300 MiB por tarea incluidos inactivos y 25 archivos. Regresión nueva sobre MySQL 33316 con archivos de límite, hashes de descarga, firmas/manipulación, accesos ajenos, bajas y carrera de cuota; nunca se cargó la base personal del puerto 3306. Se prepararon seis formatos válidos PNG/JPG/MP4/WEBM/PDF/DOCX. La reproducción visual de todos los formatos en Chrome/Edge sigue pendiente; PDF sí quedó visible en IAB. El DOCX descargado por HTTP fue abierto en solo lectura y exportado por Word instalado; Poppler abrió el PDF descargado. Esto acredita compatibilidad de esos fixtures, no todos los documentos posibles ni el diálogo de descargas de cada navegador.

Reinicio controlado de MySQL sintético: 503 durante caída, 200 después, mismo SHA-256 de posiciones. Respaldo/restauración real con mysqldump/mysql en dos esquemas sintéticos nuevos de la instancia aislada: esquema completo, un usuario y 21 tareas con dos relaciones; se compararon texto, bitácora, posiciones, versiones y dependencias. No se distribuye el dump. Restaurar devuelve filas de sesiones revocadas después del respaldo: **invalidar todas las familias y rotar JWT_SECRET antes de abrir tráfico**. DELETE de familias restauradas y cascada de renovaciones comprobados por SQL. No se ejecutó login HTTP contra el esquema restaurado: el intento de ampliar permisos del usuario de prueba fue rechazado por revisión automática y se omitió. Se utilizó una alternativa SQL sin ampliar acceso. No se afirma recuperación integral ante corte abrupto de energía ni toda operación interrumpida.

## Rendimiento y criterios originales

Se prepararon 100 nodos con 160 dependencias. IAB muestra filtro y métricas, zoom/encaje, pantalla completa/Escape y vista previa/cancelación de autoorganización. Instrumentación rAF temporal de 15,012 s: 1396 intervalos, 92,99 FPS de media, p95 14 ms, 8 intervalos >50 ms. Mezcla zoom por clics y reposo; sin comparación basal ni arrastre continuo. Se retiró la instrumentación antes del build final. No se certifica RNF-4 para todos los navegadores/dispositivos.

Se localizaron los originales US-01 a US-23 y RNF-1 a RNF-5 en documentación V0.5.0 del proyecto, copiados sin cambios con hashes. `TRAZABILIDAD_V0.5.20.md` transcribe los criterios y distingue lo probado de brechas: bitácoras sin timestamp por nota, rechazo sin motivo obligatorio, historial paginado/rango de fechas no encontrado, semáforo de jornada y otros criterios no aceptados. Debe confirmar el equipo la vigencia del alcance original y resolver las brechas. No se inventan responsables individuales ni aceptación académica.

## Dependencias y límites de la auditoría

- npm audit final: 0 alertas registradas para el lock actual; no significa ausencia de vulnerabilidades.
- Árbol transitivo Maven nuevo conservado. Dependency-Check 13.0.0 con caché disponible: 87 entradas, 47 únicas, 0 vulnerables reportadas, umbral CVSS 7 intacto. **Caché histórica de NVD, sin actualización exitosa**; OSS Index carece de credenciales. La consulta actual falló por clave NVD ausente/inválida (longitud cero). No se ocultó el error ni se añadió supresión.
- Spring Security 7.1.2 y Data JPA 4.1.2 quedan fuera de rangos afectados 7.1.0/4.1.0 de los avisos oficiales revisados de agosto; además no se usan DPoP, WebAuthn ni servidor OAuth de consentimiento. Se revisaron CVE-2026-41707, 47834, 47841, 47842 y 47877. Es una revisión acotada, no exhaustiva.
- Tomcat 11.0.27 se conserva, confrontado con su página oficial de seguridad. Connector/J 26.10.0 se conserva frente al CPU Oracle de octubre. No se cambió MySQL personal.
- PDF.js 6.5.438 supera la versión corregida 6.2.108 del aviso GHSA-hq66-cqwq-w95j. El aviso exige viewer con scripting; TimeFlow solo usa la API canvas sin ese subsistema. Se incluye licencia Apache del paquete.
- Vite 8.2 recibe parches según su política oficial; se conserva 8.2.6 con lock auditado. No se exponen Vite ni el backend sintético a LAN.

Fuentes primarias consultadas el 15/11/2026: [Spring](https://spring.io/security/), [DPoP](https://spring.io/security/cve-2026-41707/), [JPA](https://spring.io/security/cve-2026-47834/), [WebAuthn](https://spring.io/security/cve-2026-47841/), [AES](https://spring.io/security/cve-2026-47842/), [consentimiento](https://spring.io/security/cve-2026-47877/), [Tomcat](https://tomcat.apache.org/security-11), [Oracle CPU](https://www.oracle.com/security-alerts/cpuoct2026.html), [PDF.js](https://github.com/mozilla/pdf.js/security/advisories/GHSA-hq66-cqwq-w95j), [Vite](https://vite.dev/releases).

## Riesgos que mantienen abierto el sprint

Limitador sigue en memoria: reiniciar borra contadores y varias instancias no comparten cuota; un proxy mal configurado agruparía usuarios por IP. No se certifica protección distribuida. NVD actual pendiente; reinicio completo Chrome/Edge y dos interfaces independientes pendientes; brechas US/RNF y pruebas prolongadas/corpus hostil pendientes. CSRF/CORS/JWT/BCrypt/autorización se conservan y se volvieron a comprobar por pruebas técnicas. No se declara el sistema libre de vulnerabilidades.
