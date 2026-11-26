# TimeFlow

Plataforma web para registrar jornadas, organizar tareas y revisar el trabajo del equipo.

## Versión del repositorio

El código corresponde a **V0.5.23-SNAPSHOT**, tomado del paquete `TimeFlow_V0.5.23_Backend_Frontend_Ordenados.zip`. Backend y frontend deben utilizarse juntos. El Sprint 7 se dedica a documentación y preparación de la entrega.

Se incluyen las fuentes, los instaladores, los archivos SQL, las pruebas y la documentación. Las compilaciones, las dependencias descargadas y las configuraciones privadas se generan en cada equipo y no se incluyen en Git.

## Instalación en Windows

1. Descarga el repositorio completo y extrae sus archivos. Conserva las carpetas `backend`, `frontend` y `scripts` junto al instalador principal.
2. Ejecuta `INSTALAR_DEPENDENCIAS_TIMEFLOW.bat` desde la carpeta principal. Acepta los permisos de administrador y sigue el resultado en la ventana elevada.
3. El instalador comprueba Java 21, Node.js y npm, Visual C++, MySQL, la configuración local y los paquetes del proyecto. Necesita internet para descargar lo que falte.
4. Introduce la contraseña actual de MySQL cuando se solicite. Si MySQL es nuevo, conserva la contraseña definida durante su instalación.
5. Si no existen usuarios, configura el correo y la contraseña del administrador inicial de TimeFlow. Esta cuenta es distinta de la cuenta de MySQL.
6. Espera el resumen final y comprueba que aparezca `TODO LISTO`. Si hay un error, revisa `backend/INSTALADOR_DIAGNOSTICO.txt` antes de iniciar los servidores.

La configuración privada se guarda en `backend/config_local.bat`, excluido de Git. No hay una contraseña universal para iniciar sesión.

Si ya hay una base de datos, detén el backend anterior antes de instalar. El instalador revisa las bases compatibles desde V0.5.19 y crea un respaldo externo antes de aplicar cambios pendientes. Las bases anteriores requieren revisar su procedimiento de actualización. Conserva el respaldo y los mensajes del instalador.

## Iniciar la aplicación

1. Comprueba que el servicio MySQL esté disponible.
2. Ejecuta `backend/iniciar_servidor.bat` y espera a que el backend termine de iniciar en el puerto 8080.
3. Ejecuta `frontend/iniciar_servidor.bat` y deja ambas ventanas abiertas.
4. Abre [TimeFlow local](http://localhost:5173/) e ingresa con la cuenta configurada o con una cuenta existente.

La configuración incluida funciona en el propio computador. Utiliza `localhost` tanto para la página como para la API. Acceder desde otro equipo requiere preparar el despliegue y su configuración.

Para detener la aplicación, guarda el trabajo y cierra la sesión. Presiona Ctrl y C en la ventana del frontend y después en la del backend. Al volver a utilizarla, inicia los dos servidores en el mismo orden. No es necesario repetir la instalación si las dependencias están completas.

## Funciones principales

* Registro de entrada, salida y presencia laboral.
* Tareas simultáneas con metas, fechas límite, notas y contadores independientes.
* Archivos de evidencia y consulta de adjuntos desde la jornada.
* Envío a revisión, devolución con motivo y aprobación final.
* Mapa con dependencias múltiples y organización con vista previa.
* Historial de tareas finalizadas.
* Chat, anuncios, gestión de cuentas y plantillas según el perfil.

## Documentación

* [Manual de usuario con instalación y uso](Documentacion/Sprint7/Manual_de_usuario_TimeFlow.docx)
* [Plan del Sprint 7](Documentacion/Sprint7/TimeFlow_Sprint_Backlog_7.docx)
* [Comprobaciones de esta actualización del repositorio](Documentacion/Sprint7/Revision_repositorio.md)
* [Informe de cierre del Sprint 6](Documentacion/Sprint6/Informe_Cierre_Sprint6_TimeFlow_V0.5.23.docx)
* [Organización de backend y frontend](Documentacion/Actual/ORGANIZACION_BACKEND_FRONTEND.md)
* [Índice de documentación del paquete](Documentacion/INDICE.md)

Los documentos y las evidencias de versiones anteriores se conservan como antecedentes. Sus resultados y estados describen el momento en que se registraron. Esta actualización del repositorio no declara completados los demás entregables ni el ensayo de la defensa del Sprint 7.

## Pruebas y compilación

Desde `frontend`, con Node.js y npm disponibles:

```powershell
npm ci
npm run test:sprint5
npm run build
```

El nombre `test:sprint5` se conserva por compatibilidad y ejecuta las pruebas disponibles en `frontend/tests`.

Desde `backend`, con Java 21 disponible:

```powershell
.\mvnw.cmd test
.\mvnw.cmd package
```

Estas comprobaciones automáticas no sustituyen una revisión completa de la instalación, la interfaz y la integración con MySQL.

## Archivos locales

No publiques `config_local.bat`, archivos privados de entorno, contraseñas, claves, bases de datos ni respaldos. `.gitignore` también excluye `node_modules`, `dist`, `target`, herramientas descargadas y registros locales. Los ejemplos de configuración permitidos no contienen claves reales.

Para revisar la instalación, conserva el registro de diagnóstico en el equipo y comunica el error sin compartir las claves locales.
