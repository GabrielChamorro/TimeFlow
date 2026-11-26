# TimeFlow V0.5.13-SNAPSHOT

Actualización de seguridad sobre la V0.5.12. No modifica la estructura de MySQL ni las funcionalidades de monitoreo espacial.

- Actualizado Vite a 8.2.6 y restringido el servidor de desarrollo a 127.0.0.1.
- Mitigado el ataque de prueba de contraseñas sobre múltiples cuentas desde una misma IP.
- Reducida la diferencia de tiempo entre login con cuenta existente e inexistente.
- Verificación adicional de estructura y expansión en archivos DOCX.
- Vista previa de PDF sin permisos de ejecución de scripts.
- Cinco nuevas pruebas JUnit y cuatro nuevas pruebas estáticas de frontend.

Ver `Documentacion/Sprint6/AUDITORIA_SEGURIDAD_V0.5.13.md` para resultados comprobados, límites y riesgos pendientes.
