# Pendientes de V0.5.18-SNAPSHOT

Sprint 6 permanece abierto. Las compilaciones, permisos y casos registrados están respaldados por ejecuciones reales; los puntos siguientes no se consideran aprobados.

| Pendiente | Motivo / alcance restante |
| --- | --- |
| US-01…US-23 y RNF-1…RNF-5 | La documentación entregada menciona los identificadores, pero no define individualmente sus criterios. Hace falta el catálogo original para completar la trazabilidad. |
| Auditoría transitiva actual del backend | La actualización NVD falló sin clave. La caché analizada data del 25 de octubre; OSS Index requiere credenciales. |
| Logout y revocación persistente | El navegador limpia el token al salir, pero un JWT copiado puede seguir vigente. Una cuenta reactivada con la misma contraseña puede aceptar sesiones anteriores no expiradas. |
| Almacenamiento de sesión | JWT sigue en localStorage. No se hizo una migración incompleta a cookies ni se desactivó seguridad. |
| PDF y documentos | El visor PDF protegido quedó vacío en el navegador integrado; descarga íntegra comprobada y alternativa indicada. No se verificó abrir el DOCX descargado desde la galería en Word. |
| Archivos maliciosos | Firmas, rutas y expansión DOCX verificadas; no hay certificación antivirus, CDR ni validación semántica completa de todos los formatos. |
| Ediciones del mismo campo | Los bloqueos corrigen pérdidas cruzadas de posiciones y protegen el grafo/cuotas. Falta versionado optimista de todos los formularios de tareas, cuentas y tipos. |
| Despliegue distribuido | El límite de login vive en memoria y se reinicia con el proceso. No se probó una instalación con varias instancias. |
| Rendimiento | No se midieron FPS ni se ensayó carga prolongada. MySQL de prueba tuvo esperas por redo log de capacidad predeterminada; no es una medición de producción. |
| Recuperación ampliada | Reinicios controlados y subida interrumpida comprobados. Faltan cortes eléctricos, restauración de respaldo real, respuesta perdida después de COMMIT y todas las intercalaciones de operaciones. |
| Interfaz y accesibilidad | Mapa y confirmaciones comprobados en el navegador de prueba. Faltan todos los navegadores/resoluciones y una revisión completa de accesibilidad. Persisten 16 advertencias de lint. |

No se reportó una vulnerabilidad crítica/alta confirmada en el alcance comprobado. No se garantiza ausencia de vulnerabilidades desconocidas ni se certifican los puntos pendientes.
