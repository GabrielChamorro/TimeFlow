# Entrega TimeFlow V0.5.21-SNAPSHOT

Sprint 6 abierto. Continuación directa de V0.5.20. Código completo, delta SHA-256 desde su ZIP, JAR y build Vite verificados. Aplicar backend/frontend juntos y ejecutar las dos migraciones aditivas con respaldo previo.

- Documentacion/Sprint6/INFORME_V0.5.21.md y CAMBIOS_V0.5.21.md: implementación y alcance.
- RESULTADOS_V0.5.21.md y Evidencias/Sprint6/V0.5.21: pruebas nuevas reales.
- TRAZABILIDAD_V0.5.21.md: criterios originales sin cambios y seis filas actualizadas.
- INSTALAR_Y_MIGRAR_V0.5.21.md, scripts/Migrar_V0521.ps1 y backend/sql/migracion_v0_5_21_*.sql: instalación/respaldo/migración.
- TimeFlow_Sprint_Backlog_6_Actualizado.docx: formato preservado, ocho páginas revisadas.
- PENDIENTES_V0.5.21.md: US-03, cronómetros US-06, RNF y verificaciones operativas abiertas.

93/93 Node, 148/148 JUnit, 152/152 HTTP/MySQL, 49/49 funcionales y 32/32 Newman. No sumar como casos únicos: hay solapamiento. No es versión estable ni certificación productiva. Sin bases, backups, perfiles ni secretos de pruebas. Compilados dentro del ZIP completo: bin/ y frontend/dist/. El delta es de fuentes: recompilar o usar el ZIP completo y reemplazar dist completo, sin mezclar compilados antiguos.
