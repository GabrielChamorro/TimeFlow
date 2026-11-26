# Correcciones de TimeFlow V0.5.19-SNAPSHOT

Corte: 15 de noviembre de 2026, America/Santiago. Continúa el trabajo interrumpido sobre V0.5.18; el Sprint 6 sigue abierto. La copia recibida no tiene Git. Se comparan SHA-256 contra el ZIP V0.5.18 conservado; no se restauraron fuentes antiguas.

## Sesiones persistentes

- Acceso JWT en memoria, con vencimiento predeterminado de 5 minutos; renovación aleatoria de 256 bits en cookie HttpOnly, host-only, SameSite=Strict, Path=/api/auth, Max-Age limitado a una sesión absoluta de 30 días. No se guarda JWT en localStorage/sessionStorage.
- MySQL conserva SHA-256 del identificador firmado de sesión y de cada renovación; nunca el JWT ni el token de renovación completos. Los registros de renovación usados se conservan hasta caducar la familia para detectar reutilización.
- POST /api/auth/refresh rota la renovación y devuelve acceso/usuario. F5 restaura usuario y rol antes de mostrar el panel; mientras tanto se muestra “Comprobando sesión”. Fallos de red muestran reintento, sin simular una sesión caducada.
- Logout revoca la familia correspondiente y borra su cookie. Contraseña, correo, rol, baja y reactivación revocan las sesiones de esa cuenta. Una reactivación no restaura tokens anteriores. La lectura de usuario bloqueada serializa estas operaciones con login/renovación.
- Renovaciones simultáneas con la misma cookie: una responde 200 y otra 409, sin entregar credenciales ni borrar la cookie ganadora. Reutilizar el token usado después de 5 segundos revoca la familia completa, incluido su acceso JWT. Esa ventana evita invalidaciones por duplicados recientes; el token consumido nunca vuelve a emitir acceso.
- El cliente comparte una sola renovación entre solicitudes de su pestaña y usa Web Locks entre pestañas cuando está disponible. Reintenta una vez un 409 con la cookie actual. Un cambio de identidad impide reenviar operaciones antiguas con la cuenta nueva.
- Login, refresh y logout exigen Origin exacto permitido y X-TimeFlow-CSRF: 1. La cabecera obliga a preflight en solicitudes cross-origin. No basta enviar la cookie. CORS permite credenciales solo bajo /api/auth/**, con orígenes explícitos; las API de datos envían credentials: omit y solo aceptan Bearer.
- Producción exige HTTPS, Secure y orígenes HTTPS. AUTH_LOCAL_HTTP=true se admite únicamente con orígenes, host y conexión loopback; permite Vite/API en puertos distintos del mismo hostname. No mezclar localhost y 127.0.0.1. No se desactivaron autenticación, firma JWT ni permisos.

Se eligieron cabecera no simple más validación estricta de Origin para CSRF, siguiendo la [guía OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html). La rotación y detección de reutilización se apoyan en [RFC 9700, sección 4.14](https://www.rfc-editor.org/rfc/rfc9700.html#section-4.14). Es un esquema propio de sesión, no una implementación de OAuth completa.

## Conflictos de edición

Tareas, usuarios y tipos tienen @Version de JPA y una columna BIGINT. PUT compara la versión leída por el formulario con la fila bloqueada antes de modificarla; devuelve 409 ante edición obsoleta o baja concurrente. Las transacciones y bloqueos del grafo, cuotas y posiciones siguen activos. Los movimientos incrementan la versión de tarea y no se sobrescriben desde un formulario viejo.

Los tres formularios conservan el borrador y permiten consultar los datos actuales antes de adoptar su versión. No guardan automáticamente después de un conflicto. Las cuentas o plantillas desactivadas no se pueden adoptar para guardar. En Mi Jornada, bitácora/meta se guardan explícitamente; enviar a aprobación guarda el borrador y el nuevo estado en una sola petición. Se sustituyeron las escrituras por cada pulsación para evitar carreras y pérdida de texto.

## Migraciones y compatibilidad

Hay cinco scripts aditivos e idempotentes: sesiones, tareas, renovación, usuarios y tipos. Se probaron repetidos sobre MySQL 8.4.13 aislado en 33316 y en un esquema nuevo. No se alteró la instancia personal 3306. El arranque falla si faltan columnas/tablas; nunca acepta JWT omitiendo el registro persistente. Scripts/Migrar_V0519.ps1 exige respaldo previo antes del primer cambio; se verificó su sintaxis y los SQL reales, pero no se ejecutó el respaldo completo desde ese asistente.

Actualizar frontend y backend juntos. Los clientes PUT deben reenviar version; los clientes de login/refresh/logout deben cumplir CSRF/Origin. Al migrar desde V0.5.18 hace falta iniciar sesión una vez: sus JWT antiguos no tienen una sesión de renovación registrada. No cambian contraseñas ni relaciones históricas.

## Evidencia y límites

RESULTADOS_V0.5.19.md separa ejecuciones actuales, heredadas e intermedias. La sesión interrumpida dejó 68 pruebas relacionadas y 41 comprobaciones MySQL; no se confunden con el sistema de renovación terminado. También se conservaron sus correcciones de tareas.

No se repitió la auditoría general de dependencias: sigue pendiente NVD actual del backend. La cookie persistente, F5, reapertura de pestaña, expiración, reutilización, CSRF y reinicio de backend sí se verificaron. Cerrar y reiniciar el proceso completo de un navegador de escritorio, el despliegue HTTPS real, varios servidores y todos los navegadores siguen pendientes. XSS puede realizar acciones durante una sesión activa aunque HttpOnly impida leer la renovación; no se afirma inmunidad a XSS. El rate limiter sigue local en memoria.

El borrado de familias caducadas es acotado a 100 registros por login nuevo; sus renovaciones se eliminan en cascada. Sin nuevos logins pueden quedar filas caducadas, que nunca autentican. Puede programarse limpieza operativa con respaldo. Tras restaurar una copia antigua de BD debe rotarse JWT_SECRET y vaciar sesiones antes de habilitar accesos para evitar restaurar sesiones revocadas.
