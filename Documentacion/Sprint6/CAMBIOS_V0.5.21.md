# Cambios de TimeFlow V0.5.21-SNAPSHOT

Candidata desde V0.5.20; Sprint 6 abierto. No se reconstruyó el proyecto.

- US-07: notas por agregado con fecha/autor del servidor, permisos y paginación. Legado intacto; compatibilidad con clientes antiguos archiva el texto reemplazado.
- US-10: motivo obligatorio al rechazar, validado en backend, historial por devolución y versión/409 conservada.
- US-19: historial SQL paginado con búsqueda, fechas UTC, responsables, estados y detalle privado bajo demanda. Cierre de servidor para nuevas finalizaciones; fecha antigua desconocida explícita.
- US-04: nombre/meta/hora límite obligatorios sin sustitutos automáticos; no se obliga a rehacer tareas antiguas.
- US-05: título y descripción de plantilla activa autocompletados y comprobados en navegador.
- US-02: advertencia accesible, cancelar/confirmar salida y duración con segundos; espera al listado inicial antes de permitir salir.
- Dos migraciones aditivas, helper de respaldo/migración y prueba HTTP pública nueva: scripts/probar_funcionalidades_v0521.py.

Regresión nueva: 93 Node, 148 JUnit/MockMvc, 152 HTTP/MySQL, 49 funcionales, 32 Newman. No se eliminaron pruebas; se actualizaron fixtures para cumplir los campos obligatorios. PDF y F5 comprobados con el código final. Ver INFORME y RESULTADOS para límites.

Pendientes funcionales: US-03 y cronómetros US-06; pendientes adicionales en PENDIENTES_V0.5.21.md. Las verificaciones anteriores se conservan como antecedentes. No es una versión estable.
