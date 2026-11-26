# TimeFlow V0.5.10-SNAPSHOT — Auditoría del código

**Base:** ZIP completo de TimeFlow V0.5.9 del Sprint 6. Se conservan las funcionalidades anteriores, incluidas las dependencias múltiples, el mapa con flechas curvas, las evidencias de hasta 60 MB y la desactivación de registros.

## Problemas comprobados y cambios realizados

1. **Validación de dependencias:** el recorrido era recursivo y podía terminar en un desbordamiento de pila si la cadena era muy larga. Se sustituyó por un recorrido iterativo, con detección de ciclos y límite de 10.000 tareas exploradas. Se mantuvo el límite de 500 requisitos directos.
2. **Tokens después de cambiar contraseñas:** anteriormente se validaban firma, fecha, correo e ID, pero no si la contraseña había cambiado. Ahora los tokens incluyen una marca protegida que depende del hash de contraseña actual. Los tokens anteriores dejan de funcionar si la contraseña cambia, sin modificar tablas de MySQL. **Al instalar V0.5.10 hay que iniciar sesión otra vez.**
3. **Intentos repetidos de login:** añadida una protección en memoria por dirección IP y correo. Tras 8 intentos fallidos dentro de una ventana de 15 minutos devuelve HTTP 429. No guarda contraseñas ni se basa en cabeceras IP manipulables. Su estado se reinicia al reiniciar Spring Boot y no sustituye a un límite distribuido.
4. **Riesgo de mezclar sesiones en el navegador:** ahora las respuestas tardías de la carga inicial, el chat y la actualización manual se descartan cuando pertenecen a otra sesión. Se limpian las listas al cerrar sesión o iniciar otra. Además, las operaciones principales que devuelven datos ignoran resultados de sesiones anteriores.
5. **Errores de presentación:** añadido un límite de recuperación de React. Si un componente falla al dibujarse, se muestra un mensaje útil en lugar de toda la página blanca. Se rechazan respuestas que no sean listas para las vistas que esperan listas.
6. **Privacidad del directorio de usuarios:** ahora trabajadores reciben solo identificador, nombre, rol y estado de los otros miembros. Los administradores conservan la información necesaria para gestionar cuentas. La consulta individual limita la información del mismo modo.
7. **Confirmación de acciones:** el detalle ya no se cierra automáticamente al aprobar, devolver o desactivar una tarea antes de recibir una respuesta positiva. Si falla la solicitud, muestra un aviso y conserva el formulario.
8. **Autobloqueo administrativo:** se evita que un administrador se desactive o se quite su propio rol mediante PUT a su cuenta. El DELETE de su cuenta ya tenía esa protección.

## Comprobaciones realizadas en este entorno

- `node --test frontend/tests/*.test.mjs`: **40 de 40** pruebas aprobadas (38 originales y 2 nuevas).
- Análisis de sintaxis JSX/JavaScript con el compilador TypeScript: **21 archivos sin errores de sintaxis**.
- Compilación Java 21 y prueba ejecutable de los algoritmos de dependencias y limitación de login con clases auxiliares: **aprobada**. La prueba abarcó una cadena de 4.000 tareas, detección de un ciclo y bloqueo/restablecimiento de intentos.
- Se añadieron pruebas JUnit para cambio de contraseña, lectura del directorio, protección de la cuenta del administrador y dependencias extensas. **No se pudieron ejecutar aquí** porque no están disponibles las dependencias Maven del backend.

## Pruebas que siguen pendientes

- `mvnw.cmd clean verify` y ejecución completa del backend con MySQL 8.4 en Windows.
- `npm ci` y `npm run build` con Vite instalado, ya que este entorno no dispone de sus dependencias locales.
- Pruebas manuales de creación, edición, aprobación y desactivación en la interfaz real.
- Repetir las colecciones de Postman con administración, trabajadores y cambio de contraseña.
- Verificar operaciones simultáneas sobre dependencias. Dos peticiones paralelas todavía podrían alterar el grafo sin una serialización completa de los cambios en la base de datos.
- Revisar dependencias de terceros con `npm audit` y OWASP Dependency-Check actualizados; se mantuvieron las versiones del proyecto sin afirmar que estén libres de vulnerabilidades.
- Auditar cargas HTTP sin `Content-Length` y documentos comprimidos maliciosos para completar las defensas ante consumo excesivo de recursos.

**Estado:** V0.5.10 es una versión en pruebas, no una certificación de seguridad. No se modificó el esquema de MySQL ni se creó una migración nueva.
