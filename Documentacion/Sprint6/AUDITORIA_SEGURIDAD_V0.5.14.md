# TimeFlow V0.5.14-SNAPSHOT — Segunda revisión de seguridad

**Base revisada:** TimeFlow V0.5.13-SNAPSHOT (ZIP completo).  
**Fecha:** 13 de noviembre de 2026.  
**Alcance:** autenticación/autorización, HTTP, dependencias múltiples, archivos adjuntos, código fuente y configuración local. No hubo acceso a la base de datos real del usuario.

## Hallazgos confirmados y cambios

| Nivel | Hallazgo en V0.5.13 | Corrección V0.5.14 | Archivos |
| --- | --- | --- | --- |
| Medio (disponibilidad) | `RequestSizeLimitFilter` solo evaluaba `getContentLengthLong()`. Las solicitudes JSON por fragmentos sin longitud declarada podían eludir esta comprobación. | Para POST/PUT/PATCH sin longitud, se leen como máximo 4 MiB + 1 byte, se devuelve HTTP 413 si excede y se entrega al controlador el cuerpo original si es válido. | `backend/.../security/RequestSizeLimitFilter.java` |
| Medio (integridad) | Dos actualizaciones simultáneas de dependencias podían verificar un grafo sin conocer el cambio concurrente y dejar un ciclo. | Las altas/ediciones de tareas ahora comparten un bloqueo de fila en MySQL (`SELECT ... FOR UPDATE`) dentro de la transacción. Se usa `READ_COMMITTED` para verificar relaciones confirmadas después de esperar el bloqueo. | `TareaRepository.java`, `TareaController.java` |
| Medio (configuración local) | Tomcat no tenía una dirección de escucha explícita: según la configuración del equipo, podía aceptar conexiones por otras interfaces de red. | La API queda vinculada a `127.0.0.1` de forma predeterminada. Para desplegar de otra manera debe fijarse `SERVER_BIND_ADDRESS` conscientemente. | `backend/src/main/resources/application.properties` |

**Detalles importantes:**
- El bloqueo de dependencias toma la fila de menor ID de `tareas` y la mantiene hasta el fin de la transacción. TimeFlow conserva las filas desactivadas, por lo que esa fila permanece en el uso normal. Si la tabla no tiene tareas, no hay relaciones previas que formen un ciclo.
- Los límites y permisos anteriores de subida de archivos no cambian. La ruta válida de multipart sigue utilizando `spring.servlet.multipart.max-request-size=61MB`; la nueva lectura limitada a 4 MiB no se aplica allí para evitar almacenar otra copia de archivos grandes.
- El nuevo filtro usa el cuerpo limitado en memoria solo cuando no se declara el tamaño y no se trata de la ruta multipart válida. La validación en Tomcat/Spring para multipart sin Content-Length debe comprobarse de extremo a extremo.
- No hay migración SQL ni cambios en la estructura de la base de datos. Se preservan las dependencias múltiples, la interfaz y los datos existentes.

## Avisos externos revisados

- **Vite 8.2.6:** el aviso crítico GHSA-p4f5-76q4-ffq7 afecta hasta 8.2.4 en esa rama, y se corrigió a partir de 8.2.5. Se mantiene Vite 8.2.6 sin modificar la dependencia. Fuente: https://github.com/vitejs/vite/security/advisories/GHSA-p4f5-76q4-ffq7
- Esto **no equivale** a una auditoría completa de dependencias transitivas del frontend o del backend.

## Comprobaciones realizadas

- **Frontend:** `node --test tests/*.test.mjs`: 54 de 54 aprobadas.
- **Filtro HTTP:** compilación aislada con Java 21 usando interfaces mínimas para servlet/Spring; prueba ejecutable aprobada para JSON pequeño sin Content-Length (reenvío sin cambios), JSON demasiado grande sin Content-Length (413) y cuerpo demasiado grande con longitud declarada (413).
- **Análisis del código:** verificado que ambos métodos que modifican las dependencias emplean el bloqueo antes de validar, que tienen `Isolation.READ_COMMITTED` y que el SQL declara `FOR UPDATE`.
- **JUnit añadido:** `SeguridadV0514Tests.java` contiene cuatro pruebas nuevas. **Pendiente:** ejecutarlas con Maven y dependencias reales.
- **No se hizo:** `mvnw.cmd test`, `npm ci` + `npm run build`, pruebas de concurrencia con MySQL ni pruebas de interfaz en navegador. Por lo tanto no se puede certificar que la versión esté libre de regresiones.

## Riesgos abiertos

1. **JWT en `localStorage`:** un XSS podría robar sesiones. Requiere una migración cuidadosamente probada a cookies HttpOnly, SameSite y protección CSRF; no se modificó a ciegas.
2. **Bloqueo de login en memoria:** se reinicia al reiniciar el backend y no se comparte entre servidores. Si se desplegara públicamente, haría falta una solución compartida.
3. **Contraseñas de configuración local:** `config_local.bat` contiene secretos del equipo en texto legible. Está excluido de Git, pero conviene proteger el acceso al archivo y nunca incluirlo en un ZIP de distribución.
4. **Edición concurrente de dependencias:** el diseño ya incorpora bloqueo, pero su comportamiento efectivo, transacciones y rendimiento necesitan una prueba real en MySQL con dos conexiones simultáneas.
5. **Adjuntos:** validar la firma y la estructura de los archivos no sustituye un análisis antivirus o aislamiento de documentos potencialmente peligrosos.
6. **Despliegue fuera de localhost:** requerirá HTTPS, gestión segura de secretos, revisión de cabeceras y CORS, así como pruebas de carga y de seguridad adicionales.

## Prueba recomendada en Windows

1. Respaldar V0.5.13 y descomprimir V0.5.14 en una carpeta distinta. No copiar el archivo privado `config_local.bat` a repositorios públicos; solo reusarlo localmente si procede.
2. En `backend`, ejecutar `mvnw.cmd test`. Revisar `SeguridadV0514Tests` y el resto de las pruebas Java.
3. En `frontend`, ejecutar `npm ci`, `npm run build` y `npm run test:sprint5`.
4. Iniciar backend y frontend, verificar login, Check In, creación de tareas y Monitoreo Espacial.
5. Probar dos peticiones concurrentes: A depende de B y B depende de A. **Una de las operaciones debe ser rechazada** para evitar un ciclo. Hacerlo sobre datos de prueba.
6. Verificar que el backend escucha en `127.0.0.1:8080` y no es accesible desde otro equipo. Si usas acceso por LAN intencionadamente, configura `SERVER_BIND_ADDRESS` solo después de revisar firewall y HTTPS.

**Estado:** V0.5.14-SNAPSHOT, correcciones aplicadas y verificaciones parciales. No certificada para producción.
