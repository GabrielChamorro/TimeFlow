# TimeFlow V0.5.5

## Cambios realizados

Se reemplazo el borrado fisico por la desactivacion de registros. Al desactivar tareas, plantillas, cuentas de usuario, evidencias y mensajes, sus datos se conservan en MySQL.

Las listas de la aplicacion muestran solamente los registros activos. Las tareas desactivadas no aparecen en el mapa, pero sus posiciones, descripciones y archivos siguen guardados.

El registro de jornada mantiene su historial. Una cuenta desactivada no puede iniciar sesion ni utilizar los tokens que tenia antes.

Las dependencias entre tareas permanecen en la base de datos. El mapa omite las conexiones hacia tareas desactivadas. La reactivacion permite recuperar las relaciones anteriores.

Se actualizaron los botones de borrado para indicar que los registros solo se desactivan.

## Comprobaciones

Las 26 pruebas disponibles del frontend finalizaron sin fallos en el entorno de desarrollo. Se agregaron pruebas nuevas para desactivacion de tareas, usuarios, plantillas, mensajes y archivos del backend.

La compilacion completa del backend, las pruebas JUnit y la migracion de MySQL siguen pendientes de validacion en Windows.
