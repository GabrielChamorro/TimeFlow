# Resultados de V0.5.19-SNAPSHOT

Ejecución final: 15 de noviembre de 2026. Sprint 6 abierto. Evidencias: Evidencias/Sprint6/V0.5.19/.

| Comprobación | Resultado ejecutado |
| --- | --- |
| Node final | 84/84: 76 heredadas y 8 nuevas de sesiones; cero omitidas |
| Maven clean verify | 124/124: 100 heredadas y 24 nuevas; cero fallos/errores/omitidas |
| Frontend Vite | Build aprobado, 40 módulos |
| Lint | 0 errores; 26 advertencias registradas, sin silenciar reglas |
| HTTP/MySQL final | 152/152, 91.319 segundos; permisos, grafo, posiciones, bajas, archivos y cuotas |
| Postman/Newman | 28 solicitudes; 32/32 aserciones |
| Renovación MySQL final | 38 comprobaciones: cookie, rotación, CSRF, expiración, reutilización, baja, contraseña y reinicio |
| Usuarios MySQL | 20 comprobaciones; dos administradores 200/409 y baja durante edición |
| Tipos MySQL | 18 comprobaciones; dos administradores 200/409 y baja durante edición |
| Carreras MySQL final | Cuota 201/400 con 25 archivos; movimiento 200 y edición obsoleta 409; revisión posterior 200 conserva posición/bitácora |
| CORS, expiración y esquema | 6 comprobaciones; esquema nuevo y cinco migraciones repetidas |
| Word | 8 páginas exportadas con Word y revisadas en PNG; portada, índice, estilos y espaciados conservados |
| Navegador | F5 restaura sesión, reapertura de pestaña, Monitoreo, logout+F5; conflictos de cuentas/tipos con borradores conservados y guardado tras revisar |

La ronda HTTP envió nuevamente cinco archivos de 60 MiB (300 MiB), verificó descarga SHA-256, el archivo 26 y 60 MiB + 1 byte. No representa una prueba de carga prolongada. Las fixtures mínimas PDF/DOCX validan controles y transporte, no su apertura en aplicaciones. El PDF aislado y otros límites de V0.5.18 permanecen documentados.

Un test estático Node esperaba la antigua forma textual de throw; se adaptó a la misma validación con status HTTP conservado, sin quitar aserciones. Una prueba nueva detectó Origin ausente con NullPointerException: se corrigió para responder 403. Los primeros intentos intermedios quedan fuera de la aprobación final. Durante ediciones en caliente Vite registró dos fallos transitorios de recarga; las compilaciones finales pasaron.

Los 76 Node, 100 JUnit, 151 HTTP y 32 Postman de V0.5.18 son históricos; no se presentan como ejecuciones de V0.5.19. Los JSON sesiones-mysql/tareas-mysql anteriores documentan la fase interrumpida, antes de terminar la renovación; renovacion-mysql e integracion-mysql-final corresponden al JAR final.

JAR compilado, CRC validado y arrancado con MySQL: backend-0.5.19-SNAPSHOT.jar, 57593340 bytes.

SHA-256: `652b10a4addde31181f01fa61a0229d43811d6f3184440b0bb1d4b7c76a2d03c`.

Pendientes de prueba: reinicio completo del proceso del navegador, despliegue HTTPS/proxy real, varios servidores, aceptación completa US/RNF y otros puntos de PENDIENTES_V0.5.19.md. No se declara producción certificada.
