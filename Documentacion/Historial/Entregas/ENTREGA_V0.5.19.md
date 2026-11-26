# Entrega TimeFlow V0.5.19-SNAPSHOT

Sprint 6 abierto. Código completo con JAR y build frontend verificados; ZIP de cambios comparado contra V0.5.18. No hay Git en la copia recibida. ARCHIVOS_CAMBIADOS.json identifica nuevas fuentes, cambios y huellas.

- Informe: Documentacion/Sprint6/AUDITORIA_V0.5.19.md.
- Pruebas: RESULTADOS_V0.5.19.md y Evidencias/Sprint6/V0.5.19/.
- Instalación y respaldo: INSTALAR_Y_PROBAR_V0.5.19.md, scripts/Migrar_V0519.ps1 y backend/sql/migracion_v0_5_19_*.sql.
- Backlog: Documentacion/Sprint6/TimeFlow_Sprint_Backlog_6_Actualizado.docx.
- Pendientes: PENDIENTES_V0.5.19.md; la matriz US/RNF de V0.5.18 sigue pendiente de criterios originales.

Sesiones: cookie persistente HttpOnly rotada y JWT breve en memoria; F5 recupera la sesión vigente. Logout y cambios de cuenta revocan persistentemente. PUT exige version y los formularios conservan borradores ante 409.

84/84 Node, 124/124 JUnit, 152/152 HTTP/MySQL y 32/32 aserciones Newman aprobadas. Hay verificaciones adicionales de renovación y conflictos. Los paquetes excluyen bases, configuración privada, respaldos, dependencias descargadas y secretos del entorno de prueba. Aplicar frontend y backend juntos tras respaldar/migrar.
