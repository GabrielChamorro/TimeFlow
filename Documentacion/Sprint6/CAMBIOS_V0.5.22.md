# Cambios de TimeFlow V0.5.22-SNAPSHOT

Base exacta V0.5.21, verificada por SHA-256. Sprint 6 abierto.

- US-03: presencia por jornada real, verde/rojo/gris, panel compacto e indicadores en nodos; sondeo de 5 s con cancelación por sesión y latencia medida.
- US-06: acumulado y segmento de reloj por tarea en MySQL, pausas por estado/baja y reanudación; legado desconocido explícito. Tres tarjetas, F5, dos clientes y reinicios comprobados.
- Sincronización ligera: tareas, notas, propia jornada y métricas se actualizan sin F5; protección ante respuestas antiguas y arrastres en curso.
- Detalle abierto: aprobación remota bloquea acciones sin perder borrador/base; estado y cierre visibles sincronizados.
- Imágenes: portal del visor ampliado evita recorte por el modal; vistas PNG/JPG y Escape comprobados.
- Una migración SQL nueva y helper de respaldo con orden directo V19 → V22; se mantienen las dos SQL V21.
- Nuevas pruebas: 9 Node y 12 Java; suite HTTP pública de cronómetros y ocho aserciones Postman adicionales.
- Word de ocho páginas, matriz original de 28 filas, informes y evidencias actualizados.

Resultados: 102 Node, 160 JUnit/MockMvc, 152 HTTP generales, 49 funcionales previas repetidas, 64 funcionales V22 y 40 Newman. No sumar conjuntos solapados. Rendimiento prolongado, online, todos los diálogos y certificación nativa siguen pendientes.
