# Entrega TimeFlow V0.5.18-SNAPSHOT

Sprint 6 continúa abierto. Se corrigieron defectos reproducidos de concurrencia, posiciones, cuotas, validación y manejo de errores; se conservaron las funcionalidades existentes.

- **Código completo:** ZIP con todas las fuentes, documentación, evidencias y JAR compilado verificado bajo `bin/`.
- **Cambios:** ZIP separado con archivos nuevos/modificados respecto del original recibido. `ARCHIVOS_CAMBIADOS.json` permite revisar hashes anteriores y posteriores. Copie su contenido en la raíz del proyecto respaldado y reconstruya ambas partes.
- **Auditoría:** `Documentacion/Sprint6/AUDITORIA_V0.5.18.md`.
- **Resultados y evidencias:** `Documentacion/Sprint6/RESULTADOS_V0.5.18.md` y `Evidencias/Sprint6/V0.5.18/`.
- **Backlog:** `Documentacion/Sprint6/TimeFlow_Sprint_Backlog_6_Actualizado.docx`, ocho páginas; portada y estilos conservados, índice corregido.
- **Instalación y pruebas:** `Documentacion/Sprint6/INSTALAR_Y_PROBAR_V0.5.18.md`.
- **No verificado / no resuelto:** `Documentacion/Sprint6/PENDIENTES_V0.5.18.md` y matriz de aceptación.

Verificación final: 76/76 Node, 100/100 JUnit/MockMvc, build de frontend y backend correctos, 151/151 comprobaciones HTTP/MySQL y 32/32 aserciones Postman/Newman. Los fallos iniciales y reproducciones fallidas se conservan identificados.

Los paquetes excluyen node_modules, cachés, bases de datos, configuración privada y secretos de los servicios de prueba. No se modificó la instancia MySQL existente del usuario. No se necesita una nueva migración de esquema para pasar de V0.5.17 a V0.5.18.
