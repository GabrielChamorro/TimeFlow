# Pruebas TimeFlow V0.5.12-SNAPSHOT

1. Con una copia de la V0.5.11 funcionando, extrae V0.5.12 en otra carpeta.
2. No ejecutes migraciones nuevas: se utiliza la misma base de datos que V0.5.11.
3. Inicia backend y frontend con sus scripts habituales.
4. Comprueba todas las pestañas, alternando rápido entre ellas. Debe verse una transición suave y el resaltado de la pestaña activa.
5. En Tipos de tareas y Gestión de usuarios, abre formularios, edita registros y cancela. El cierre debe ser inmediato en uso, pero visualmente más natural.
6. Abre y cierra los diálogos de confirmación. Comprueba que no se pueden pulsar botones durante la animación de salida.
7. En Monitoreo Espacial, prueba tareas reales, flechas múltiples, zoom, arrastre de nodos y pantalla completa. Ninguna animación debe interferir con el movimiento.
8. Verifica que al guardar tareas/usuarios/plantillas aparece una indicación de espera y que no se muestran errores de consola.
9. Prueba también con la configuración de Windows «Reducir movimiento» activada.
10. Ejecuta desde `frontend`: `npm ci`, `npm run build` y `node --test tests/*.test.mjs`.
11. Si la página queda en blanco, abre F12 > Consola y guarda el primer error de JavaScript.

La validación de Java y MySQL debe repetirse en el equipo del proyecto antes de declarar esta versión estable.
