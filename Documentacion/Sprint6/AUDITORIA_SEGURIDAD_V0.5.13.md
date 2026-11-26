# TimeFlow V0.5.13-SNAPSHOT — Auditoría de seguridad

**Base:** ZIP de código completo V0.5.12 del Sprint 6. **Fecha:** 13 de noviembre de 2026.

## Cambios corregidos

| Prioridad | Hallazgo comprobado | Corrección | Ubicación |
| --- | --- | --- | --- |
| Alta (según condiciones de despliegue) | El proyecto fijaba Vite 8.2.4, afectado por GHSA-p4f5-76q4-ffq7. El aviso permite ejecución remota de código cuando se expone el servidor de desarrollo a la red. | Subida a Vite 8.2.6 (rama estable 8.2 corregida) y fijación explícita del servidor de desarrollo a 127.0.0.1. Se sincronizó el lockfile. | `frontend/package.json`, `frontend/package-lock.json`, `frontend/vite.config.js` |
| Media | El límite de login original permitía intentar múltiples correos desde una misma IP sin alcanzar el límite de 8 fallos por combinación IP/correo. | Se agregó un segundo límite de 30 fallos por IP en 15 minutos. No se reinicia con un login correcto. | `LoginAttemptLimiter.java` |
| Baja/Media | El login respondía más rápido para correos inexistentes, porque no ejecutaba BCrypt. Esto facilitaba inferir cuentas mediante tiempos de respuesta. | Verificación contra un hash BCrypt ficticio antes de devolver la misma respuesta genérica. | `AuthController.java` |
| Media/Alta | Un ZIP con la entrada `word/document.xml` era aceptado como DOCX sin comprobar estructura ni cantidad de datos descomprimidos. | Se exige estructura mínima del DOCX, se bloquean entradas con rutas de escape y se limita a 2.048 entradas y 128 MiB descomprimidos. | `EvidenciaArchivoRules.java` |
| Media (defensa en profundidad) | La previsualización PDF en iframe concedía ejecución de scripts a contenido externo. | El iframe conserva aislamiento pero ya no concede `allow-scripts`. La descarga permanece disponible. | `EvidenceGallery.jsx` |

**Avisos públicos consultados:**
- Vite GHSA-p4f5-76q4-ffq7 (10-11-2026): https://github.com/vitejs/vite/security/advisories/GHSA-p4f5-76q4-ffq7
- Versiones estables 8.2.x: https://github.com/vitejs/vite/releases
- React GHSA-xqc2-xf4c-x3h3: https://github.com/react/react/security/advisories/GHSA-xqc2-xf4c-x3h3

## Verificaciones realizadas

- 54/54 pruebas del frontend aprobadas con `node --test tests/*.test.mjs`, incluidas 4 pruebas de seguridad nuevas.
- Compilación aislada con Java 21 de `LoginAttemptLimiter.java` y `EvidenciaArchivoRules.java` satisfactoria, con un stub local solo para la anotación `@Component`.
- Comprobaciones ejecutadas: bloqueo por IP tras 30 fallos con diferentes correos, otra IP no bloqueada, éxito no restablece el límite de IP, DOCX básico aceptado, archivo DOCX con ruta de escape rechazado y archivo ZIP de 132 KB que intentaba expandirse a 129 MiB rechazado.
- Se agregaron cinco pruebas JUnit (`SeguridadV0513Tests.java`), **pendientes de ejecutar con Maven**.
- No se ejecutó `npm ci` con éxito: el entorno no tiene acceso al registro de npm. `npm ci --offline` comprobó la referencia a Vite 8.2.6, pero devolvió `ENOTCACHED`; por tanto **no se verificó el build Vite**.
- No se inició MySQL ni se ejecutaron pruebas integrales con backend y frontend en navegador.

## Riesgos aún pendientes / no confirmados como corregidos

1. **Token en localStorage.** Un XSS futuro podría robarlo; para eliminar este riesgo sería necesario rediseñar la sesión (cookie HttpOnly, SameSite, protección CSRF) y probar todo el login. No se modificó para evitar una regresión sin pruebas de extremo a extremo.
2. **Carga JSON sin Content-Length conocido.** El filtro `RequestSizeLimitFilter` compara Content-Length, por lo que una petición codificada por fragmentos podría no respetar los 4 MiB de JSON. Configurar un límite de cuerpo en el servidor de entrada y completar una solución con pruebas HTTP reales.
3. **Dependencias modificadas simultáneamente.** La validación de ciclos se realiza antes de guardar; las operaciones concurrentes deben probarse frente a MySQL para asegurar que no creen relaciones circulares por carrera.
4. **Rate limit por proceso.** El bloqueo de login se almacena en memoria: se reinicia al reiniciar el backend y no se comparte si hay varias instancias. En producción se requiere un almacenamiento compartido (p. ej. Redis).
5. **Archivos adjuntos.** La comprobación de firma y estructura básica no sustituye análisis antivirus, antivirus de Office o un escáner de contenido activo.
6. **HTTPS y despliegue.** `application.properties` usa MySQL y HTTP en localhost, correcto para desarrollo local; cualquier despliegue fuera de la máquina debe configurar TLS y otros controles de red.

**Sobre React y el aviso de noviembre 2026:** el proyecto contiene React y React DOM en modo cliente, no utiliza `react-server-dom-*`. El aviso crítico público atañe a React Server Components; en los archivos analizados no se detectó ese componente afectado. No se actualizó React de forma innecesaria.

## Instalación y pruebas recomendadas en Windows

1. Respaldar la carpeta V0.5.12. Extraer la V0.5.13 completa en otra carpeta.
2. Entrar en `frontend` y ejecutar `npm install` para obtener Vite 8.2.6 y actualizar/validar sus dependencias con npm. Luego ejecutar `npm run build` y `npm run test:sprint5`.
3. Entrar en `backend` y ejecutar `mvnw.cmd test`. Verificar las nuevas pruebas de `SeguridadV0513Tests`.
4. Iniciar frontend y backend con los mismos scripts de siempre y probar login, error tras intentos fallidos, galería (DOCX y PDF) y mapa con dependencias múltiples.
5. **No hay migración de MySQL en esta versión.** No repetir las migraciones de 0.5.8 si la BD ya está actualizada.

**Estado:** V0.5.13-SNAPSHOT. La ausencia de ejecución completa de Maven/npm con dependencias y MySQL impide certificar una auditoría integral o declarar el sistema libre de vulnerabilidades.
