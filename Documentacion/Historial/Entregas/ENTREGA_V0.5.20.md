# Entrega TimeFlow V0.5.20-SNAPSHOT

Sprint 6 abierto. Candidata sobre V0.5.19; no es estable. Fuentes completas, delta SHA-256 respecto al ZIP V0.5.19, JAR y build Vite verificados. Sin nueva migración de esquema; aplicar con respaldo y revisar instalación.

- Documentacion/Sprint6/AUDITORIA_V0.5.20.md: correcciones, seguridad y límites.
- RESULTADOS_V0.5.20.md y Evidencias/Sprint6/V0.5.20: ejecuciones reales nuevas.
- TRAZABILIDAD_V0.5.20.md: 23 US y 5 RNF originales recuperados, pruebas y brechas.
- INSTALAR_Y_PROBAR_V0.5.20.md: actualización, HTTPS y restore seguro.
- PENDIENTES_V0.5.20.md: condiciones que impiden cerrar.
- TimeFlow_Sprint_Backlog_6_Actualizado.docx: formato conservado, ocho páginas revisadas.

86/86 Node, 127/127 JUnit, 152/152 HTTP/MySQL y 32/32 Newman. PDF canvas, TLS local, limpieza, restore SQL y recuperación MySQL comprobados. Quedan Chrome/Edge completos y dos perfiles UI independientes, NVD actual y criterios no satisfechos. No incluye secretos, perfiles, bases, respaldos ni node_modules. Compilados en bin/ y frontend/dist/ del ZIP completo; el delta requiere la base V0.5.19 y recompilar, o usar JAR completo junto al build verificado.
