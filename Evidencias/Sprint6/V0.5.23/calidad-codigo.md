# Revisión de calidad V23

Lint final: cero errores, nueve advertencias, sin desactivar reglas. V22 tenía trece; MotionPresence elimina tres de refs/efectos y ChatView una al derivar usuarios de props. No se sustituyen animaciones por elementos estáticos.

| Advertencia restante | Revisión y tratamiento |
|---|---|
| TaskInlineEditor, sincronización del formulario limpio | Guarda base/borrador cuando no está sucio ni pendiente. Reutilizar identidades evita repetirla por filas ajenas. Una reescritura adicional requiere comprobar edición/conflicto en pantalla; se conserva la protección del borrador. |
| EvidenceGallery, dos efectos de selección/archivo | Reinicia visor al cambiar tarea/selección y sincroniza Blob URL externa; cancela respuestas y revoca URL. No retirar limpiezas para silenciar lint. La mejora de todas las rutas asíncronas de subida tras desmontaje queda como deuda de ciclo de vida, sin defecto demostrado en la fase UI. |
| Usuarios y TaskTypesView, inicio de carga | Consulta de recurso externo con bandera de montaje, número de petición y época de sesión. La advertencia se debe al estado de carga que la función inicia dentro del efecto; no se prueba un bucle. |
| WorkdayView, plantilla seleccionada | Mantiene selección válida ante catálogo y sincroniza descripción solo en modo plantilla. La regresión de plantillas se conserva. Moverlo exige comprobar altas/cambio de catálogo sin perder selección; no se fuerza una reestructura sin beneficio medido. |
| App, restauración de sesión/jornada y metadatos | Sincronizan API/identidad y estado de disponibilidad, con guardas contra respuesta antigua y limpieza. Se conserva consulta externa; no se difiere artificialmente setState para ocultar el aviso. |

Solicitudes tardías corregidas: detalle del historial con AbortController y época; directorio del chat con cancelación/época/propietario; respuesta GET inicial/manual de tareas no pisa una escritura posterior. Historial reintenta fallo/5xx, invalida por finales y aborta al cambiar consulta. Las pruebas nuevas Node verifican reutilización, orden/altas/bajas y redacción de campos privados; el marcado de historial ignora posiciones. La última compilación incluye esas correcciones; la nueva fase visual integral está pendiente tras el bloqueo nativo.

No se borraron pruebas ni aserciones para aprobar. Los fallos de arnés se corrigieron y repitieron; logs privados preservados fuera de la entrega. Estas advertencias son deuda explícita, no un certificado de ausencia de problemas React.
