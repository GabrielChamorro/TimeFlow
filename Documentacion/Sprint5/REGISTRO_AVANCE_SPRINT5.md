# TimeFlow - Cierre Sprint 5

Período: 26 oct a 8 nov de 2026. Validaciones finales: 9 nov de 2026.
Versión probada: 0.5.3-SNAPSHOT. Estado: cerrado con observaciones.

## Resultados
- Mapa con 100 nodos, selección de nodos ficticios y tareas reales, guardado y navegación: comprobado manualmente.
- Selección de plantillas distintas de Figma: corregida y comprobada.
- Chrome, Brave y Firefox: comprobados manualmente en las pantallas principales y el mapa.
- Node: 16 de 16 pruebas. Vite: compilación correcta.
- JUnit: 39 de 39. Maven: BUILD SUCCESS.
- Postman: 15 de 15 y 60 de 60.
- Rendimiento: 4 rutas, 368 lecturas de los lotes, todas HTTP 200, hasta 8 simultáneas.

## Observaciones
- La prueba 31 de Postman conserva el aviso 'No response' a pesar de figurar PASS.
- No existe umbral formal aprobado de latencia, ni medición de FPS.
- La concurrencia se midió solamente con lecturas.
- El cambio de consulta de mensajes no tiene una comparación antes y después.
- El script de índices de MySQL es opcional y no hay evidencia de su ejecución.
- No se repitió OWASP en V0.5.3.

## Documentación
- Informe_Cierre_Sprint5_TimeFlow_V0.5.3.docx
- TimeFlow_Sprint_Backlog_5_Finalizado.docx
- Anexo_Evidencias_Sprint5_TimeFlow_V0.5.3.docx
- Evidencias/Sprint5/Reportes y Capturas_Postman
