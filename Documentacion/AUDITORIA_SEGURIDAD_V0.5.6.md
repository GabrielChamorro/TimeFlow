# TimeFlow V0.5.6. Auditoría de código y seguridad

Fecha de revisión: 12 nov de 2026.
Versión analizada: V0.5.5. Versión candidata con correcciones: V0.5.6-SNAPSHOT.

## Resultado

La auditoría encontró problemas concretos en el acceso a evidencias, la identificación del dueño de una tarea, el límite de archivos y la validación de los tokens. Se prepararon correcciones, pero la versión nueva todavía necesita compilación y pruebas completas en Windows antes de considerarse estable.

## Correcciones incorporadas en la candidata

1. Archivos de evidencia: el control de solicitudes distinguía mal entre los archivos de 20 MB y las peticiones generales de 4 MB. Ahora se aceptan solicitudes multipart del endpoint de evidencias hasta 21 MB y las demás siguen limitadas a 4 MB.
2. Acceso a evidencias: un trabajador ya no puede listar o descargar adjuntos de tareas de otros usuarios. Las evidencias solo están disponibles para el responsable de la tarea y los administradores.
3. Responsables de tareas: las tareas nuevas guardan el ID del usuario además del nombre. Las tareas anteriores se vinculan con un usuario solo si el nombre es único. La lista de tareas sigue permitiendo ver los nodos del equipo, pero oculta la descripción, la bitácora, la meta y la evidencia de tareas ajenas.
4. JWT: se comprueba que el ID del token coincida con el ID de la cuenta, no solo el correo. Así se evita que un token anterior sirva para otra cuenta que use después el mismo correo.
5. Límite de evidencias: los archivos desactivados siguen contando para el límite de 25 archivos y 100 MB conservados por tarea. Las subidas usan un bloqueo para evitar superar esos límites mediante solicitudes simultáneas.
6. PDF: la vista previa usa una ventana interna más aislada del resto de la aplicación.

## Aviso de seguridad de Vite

El proyecto original incluye Vite 8.2.4. La advertencia GHSA-p4f5-76q4-ffq7, publicada el 10 nov de 2026, afecta esa versión cuando el servidor de desarrollo está expuesto a la red. La actualización oficial que corrige esa rama comienza en Vite 8.2.5.

La candidata incluye ACTUALIZAR_VITE_SEGURO.bat, que instala Vite 8.2.6, regenera package-lock.json y ejecuta pruebas y npm audit. Esta actualización necesita Internet y no se pudo ejecutar dentro del entorno de auditoría. Por eso el ZIP todavía contiene el paquete original hasta que se ejecute el actualizador. No exponer Vite a Internet ni a otras máquinas antes de actualizar.

Referencia: https://github.com/vitejs/vite/security/advisories/GHSA-p4f5-76q4-ffq7

## Comprobaciones realmente ejecutadas

- Pruebas automatizadas de frontend con Node.js: 31 aprobadas, 0 fallidas. Cinco son verificaciones del código integrado. Las otras 26 corresponden a las pruebas existentes de TimeFlow.
- Cuatro comprobaciones directas de validación de archivos en Java, ejecutadas correctamente.
- Cinco comprobaciones de estructura SQL y respaldo, aprobadas.
- Se revisaron las rutas y permisos de usuarios, tareas, mensajes, jornadas y evidencias, además de las migraciones de MySQL.

## Comprobaciones pendientes

- Compilar el backend y ejecutar JUnit con Maven. Las dependencias no están disponibles en este entorno y no fue posible descargarlas.
- Ejecutar npm ci y npm run build después de actualizar Vite. La conexión al registro npm no estaba disponible.
- Aplicar la migración sobre una copia real de teamflow_db y comprobar el respaldo.
- Probar una cuenta administradora, dos trabajadores, una tarea ajena, la reactivación de registros y un adjunto de entre 5 y 20 MB.
- Repetir Postman en V0.5.6. Las colecciones anteriores se prepararon antes de la desactivación reversible y podrían necesitar datos de prueba nuevos.
- Ejecutar de nuevo un análisis actualizado de vulnerabilidades para todas las dependencias Java y npm.

## Riesgos que todavía requieren trabajo

- El inicio de sesión no tiene un límite propio de intentos fallidos. Antes de un despliegue público, debe añadirse protección contra intentos repetidos.
- Los tokens vigentes pueden continuar funcionando después de una actualización de contraseña o tras desactivar y reactivar una cuenta, hasta su expiración. Falta un mecanismo de revocación.
- La validación de archivos comprueba tipos, firmas y tamaños, pero no realiza un análisis antivirus o una limpieza profunda de PDF y DOCX.
- Las dependencias de tareas se validan al editar, pero dos cambios simultáneos podrían requerir pruebas adicionales para descartar ciclos inesperados.
- El mapa todavía comparte nombre, responsable y estado de las tareas de otros usuarios. Se ocultan sus datos detallados. Si esa información también debe ser privada, hay que definir quién puede ver cada nodo.
- La base predeterminada utiliza la cuenta root local de MySQL. Para despliegues fuera de un entorno de pruebas conviene una cuenta exclusiva de permisos mínimos y conexiones cifradas cuando MySQL sea remoto.
- Sigue pendiente la comprobación aislada de la prueba 31 de Postman que mostraba "No response".

## Estado

V0.5.6-SNAPSHOT es una candidata de corrección, no una certificación de ausencia de vulnerabilidades. No sustituye a la última versión verificada hasta completar las pruebas pendientes.

Nota de Sprint 6: el límite inicial de 20 MB corresponde a V0.5.6. Se amplió a 60 MB en la versión candidata V0.5.7. El límite del resto de las solicitudes se mantiene en 4 MB.
