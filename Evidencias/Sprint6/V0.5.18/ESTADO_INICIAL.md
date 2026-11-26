# Estado inicial V0.5.17-SNAPSHOT — 14 noviembre 2026

Antes de corregir código se inspeccionaron 263 archivos distribuidos (excluidos artefactos generados), el backlog Word, registro, informes anteriores, fuentes, configuración y dependencias. No se encontró repositorio Git ni AGENTS.md. Se conservan ZIP original y manifiesto SHA-256 en esta carpeta local.

- npm ci: primer intento falló ENOTFOUND en sandbox; segundo intento con acceso de red aprobado, 51 paquetes instalados y 0 avisos de npm.
- Node: 74/74 aprobadas, sin omitir casos.
- Vite 8.2.6: build correcto tras instalar dependencias.
- oxlint: 0 errores, 17 advertencias (refs durante render, efectos, dependencias de hooks y exportaciones).
- mvnw.cmd clean verify: 89 ejecutadas, 88 aprobadas, 1 fallo, 0 omitidas. Fallo BackendMockMvcTests.adminPuedeGuardarPosicionMapa: espera 200, recibe 404. El mock prepara findById, el endpoint usa findByIdForUpdate. No se generó JAR aprobado.
- Primera ejecución JVM dentro del sandbox sin terminar; la repetición con acceso aprobado sí terminó. Se usan sus resultados completos.
- OWASP Dependency-Check 13.0.0 sin actualización: ejecución correcta, caché NVD fechada 25 octubre 2026, OSS Index sin credenciales. No certifica avisos posteriores.
- MySQL existente 3306 requiere contraseña: no se modificó. Se inicializó instancia independiente 8.4.13 en 33316, con datadir .audit/mysql-data y max_allowed_packet=128 MiB.
- Pendiente al corte inicial: pruebas integradas, navegador, reinicios, carga grande y auditoría con avisos actuales del backend.

Los resultados históricos del Sprint 5 y V0.5.17 se mantienen como historia, sin atribuirlos a V0.5.18.
