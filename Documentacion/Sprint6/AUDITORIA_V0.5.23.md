# Auditoría de seguridad V0.5.23

Fecha de consulta: 16 de noviembre de 2026. Resultado: controles técnicos locales verificados en el alcance de RESULTADOS; no se certifica ausencia de vulnerabilidades ni aptitud productiva. No se cambió la instalación personal, se usaron datos sintéticos y loopback 33316/18086/18087.

## Dependencias y actualidad

`npm audit --json`: cero alertas, 128 dependencias declaradas por la herramienta. OWASP Dependency-Check 13.0.0: ejecución correcta con caché, 47 dependencias examinadas y cero alertas. La caché NVD fue comprobada por última vez el 25 de octubre de 2026; el intento autorizado de actualización anónima devolvió HTTP 503. No había una credencial válida disponible; no se usaron claves ajenas ni supresiones. Estos resultados no equivalen a un análisis NVD actualizado al día de entrega. Informes JSON completos en Evidencias/Sprint6/V0.5.23.

Comandos ejecutados desde backend: `mvnw.cmd -B org.owasp:dependency-check-maven:13.0.0:check -DautoUpdate=false -Dformat=JSON -DfailBuildOnCVSS=7 -DfailOnError=true`; actualización: `mvnw.cmd -B org.owasp:dependency-check-maven:13.0.0:update-only -DnvdMaxRetryCount=1 -DnvdApiDelay=8000`. El directorio de salida privado se omite aquí. Para completar NVD, repetir con el helper `_EJECUTAR_OWASP_NVD.ps1` y una clave propia válida o cuando el servicio permita actualización anónima; no guardar claves en fuentes ni informes.

## Contraste con avisos oficiales

| Fuente primaria | Contraste con el proyecto | Resultado limitado |
|---|---|---|
| [Vite GHSA-p4f5-76q4-ffq7](https://github.com/vitejs/vite/security/advisories/GHSA-p4f5-76q4-ffq7) | Rama 8.2: afectadas 8.2.0–8.2.4; corrección 8.2.5. Proyecto 8.2.6. | Versión posterior a la corrección; servidor de desarrollo de prueba limitado a loopback. No publicarlo como servidor productivo. |
| [PDF.js GHSA-hq66-cqwq-w95j](https://github.com/mozilla/pdf.js/security/advisories/GHSA-hq66-cqwq-w95j) | Aviso incluye corrección 6.2.108. Proyecto pdfjs-dist 6.5.438; usa getDocument/canvas, sin visor web ni scripting/HTML de anotaciones. | Revisión de versión y superficie utilizada; la notación amplia del rango del aviso no se usa para prometer seguridad completa. |
| [Spring DPoP CVE-2026-41707](https://spring.io/security/cve-2026-41707/) | Spring Security 7.1.2 supera la corrección 7.1.1; sin DPoP. | No se identificó exposición de esa configuración. |
| [Spring WebAuthn CVE-2026-47841](https://spring.io/security/cve-2026-47841/) | 7.1.2; sin WebAuthn ni sesiones HTTP distribuidas. | No se identificó exposición descrita. |
| [Spring AES CVE-2026-47842](https://spring.io/security/cve-2026-47842/) | 7.1.2; sin AesBytesEncryptor; BCrypt y JWT HMAC. | No se identificó uso del componente afectado. |
| [Spring OAuth consent CVE-2026-47877](https://spring.io/security/cve-2026-47877/) | 7.1.2; no hay servidor OAuth de consentimiento. | No se identificó esa superficie. |
| [Oracle CPU octubre 2026](https://www.oracle.com/security-alerts/cpuoct2026.html) | Connector/J 26.10.0 y MySQL de prueba 8.4.13 superan los rangos reseñados 26.7.0/26.7.1 y hasta 8.4.12. | Solo se refiere a los componentes de este entorno, sin examinar ni modificar MySQL personal. |
| [Temurin octubre 2026](https://adoptium.net/news/2026/10/eclipse-temurin-17021-21013-2505-2701-available) | Java instalado 21.0.12.1; pruebas finales con 21.0.13+9 portable y hash oficial cotejado. | Se corrige el runtime del entorno de ensayo. El JAR requiere un JDK 21 actualizado en el destino; no se actualizó Java del usuario. |
| [Oracle anuncio previo noviembre](https://www.oracle.com/security-alerts/cspunov2026.html) | Publicación anunciada para 17 de noviembre, posterior al corte. | No se presenta como actualización ya revisada o aplicada. Revisar al desplegar. |

## Autenticación y autorizaciones

La regresión real repite JWT manipulado/expirado, renovación HttpOnly y rotación, CSRF por origen/cabecera, CORS, logout y revocación por baja/cambio de contraseña, roles, tareas/notas/historial privados, archivos y conflicto 409. Sesiones independientes HTTP no equivalen a perfiles de navegador independientes. La cuenta de aplicación ordinaria del ensayo tiene CRUD sobre su base; el root de la réplica se limita a la prueba aislada de recuperación y no certifica mínimos privilegios de producción.

Se corrigió un defecto demostrado: `?version=invalida` provocaba 401 en el despacho de error y podía confundirse con sesión expirada. El manejador ahora devuelve 400 JSON; MockMvc con cadena de seguridad y HTTP real lo comprueban. Las bajas de tarea/cuenta/tipo/archivo comparan la versión capturada y rechazan la obsoleta con 409 antes de modificar datos. El parámetro es opcional por compatibilidad con clientes anteriores; la UI V23 siempre lo envía. No se afirma que clientes antiguos sin versión adquieran protección optimista automáticamente.

## Limitador de login y despliegue

El limitador reside en memoria por proceso. Es proporcionado para el despliegue previsto de una sola instancia JAR de este proyecto, con umbral/expiración existentes y pruebas de exceso. Reiniciar pierde su memoria; varias instancias no comparten contadores. No cubre ataques distribuidos ni sustituye TLS y supervisión. Si se adopta balanceo, usar límites compartidos del proxy de entrada ya existente o una tabla SQL con clave/ventana y actualización atómica, medir contención y probar dos instancias antes de certificar. No se añadieron Redis ni servicios externos.

En destino: HTTPS, origen CORS exacto, `AUTH_LOCAL_HTTP=false`, secretos por entorno privado, DB_USER limitado a CRUD y DDL reservado a migración con mantenimiento. No se publicaron puertos ni se instalaron certificados globales. Restaurar con tráfico cerrado, invalidar sesiones restauradas y rotar JWT_SECRET antes de reabrir. El ensayo de restauración completo tiene evidencia independiente de login HTTP real, revocación y clave nueva.

## Archivos y riesgos residuales

Se mantienen 60 MiB por archivo, 300 MiB y 25 archivos conservados por tarea, incluidas bajas. DOCX limita entradas, expansión y rutas ZIP. Los formatos PDF/vídeo se reconocen por firma; una cabecera correcta no garantiza estructura o codec válido. El corpus registra archivos de firma admitida pero no decodificables: no se afirma sanitización completa, antivirus ni reproducción universal. No se ejecutó contenido hostil. El visor usa canvas, isEvalSupported=false, enableXfa=false y límites de imagen/canvas; no habilita scripting ni enlaces de documentos. Tras el bloqueo del control nativo no se certificó reproducción/paginación nueva en Chrome/Edge.

Pendientes de seguridad para cierre: actualización NVD efectiva y revisión de avisos al desplegar; controles TLS/backup operativos en destino; certificación visual de sesiones/cookies en navegadores nativos. Los escáneres sin alertas no resuelven esos pendientes.
