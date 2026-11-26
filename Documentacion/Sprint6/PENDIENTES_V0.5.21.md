# Pendientes de TimeFlow V0.5.21-SNAPSHOT

Sprint 6 ABIERTO. Las prioridades US-07, US-10 y US-19 se implementaron y comprobaron; US-02, US-04 y US-05 tienen verificación técnica local nueva. No equivale a aceptación académica global ni a versión estable.

## Desarrollo funcional siguiente

1. US-03: presencia verde/roja calculada por jornada abierta/cerrada y actualización automática al Check-out. El estado activo de la cuenta no acredita presencia. No se implementó en esta entrega.
2. US-06: cronómetros independientes por tarea. Se mantienen múltiples tarjetas y notas separadas; no se declara cumplido el criterio de cronómetros.
3. Completar el resto de criterios parciales de la matriz original, en particular UX/tiempo real/online y validaciones visuales por rol no repetidas. Las seis filas actualizadas tienen evidencias V0.5.21; no elevar las demás por herencia.
4. Historial: desacoplar la carga general heredada del mapa y medir volúmenes grandes. El endpoint de historial sí pagina en SQL y no descarga bitácoras/archivos; el arranque general de la aplicación conserva la carga anterior del mapa. No inventar fechas de cierre antiguas; solo recuperarlas desde fuentes fiables autorizadas, si existen.

## Verificación y operación

- Chrome/Edge completos, cerrar todas las pestañas/reiniciar proceso y dos administradores en perfiles UI independientes. IAB y sesiones HTTP reales no sustituyen estas pruebas.
- NVD actualizado y auditoría backend completa con credenciales disponibles; el resultado V0.5.20 es antecedente. npm audit V0.5.21 sin alertas no implica ausencia de vulnerabilidades.
- Medición nueva prolongada de mapa/100 nodos, rueda y arrastre, carga concurrente y navegadores/dispositivos. No se presenta FPS V0.5.20 como medición nueva.
- Apertura nativa de todos los formatos y corpus hostil de documentos/PDF complejos. PDF sintético quedó visible con V0.5.21; compatibilidad Word/Poppler V0.5.20 es antecedente.
- Limitador en memoria por proceso: conserva reservas atómicas, pero reinicio reinicia contadores y varias instancias no comparten límite. Definir política de despliegue sin introducir servicios innecesarios.
- Restore integral con aplicación y escenarios abruptos/interrumpidos. Se probó SQL de notas/rechazos y esquema; no login HTTP del esquema restaurado. Invalidar sesiones y rotar JWT_SECRET antes de abrir tráfico después de un restore.
- Revisar advertencias de lint restantes de animación/sincronización de efectos con pruebas visuales. No se desactivaron reglas.
- Confirmar con el equipo vigencia de criterios V0.5.0, cambios de alcance y aceptación académica. Esta copia no tiene historial Git y no acredita contribuciones individuales ni integración remota.

La base personal no fue modificada. Entorno sintético y credenciales no se incluyen en entregables. Consultar INFORME y RESULTADOS para alcance de cada prueba; no sumar casos solapados.
