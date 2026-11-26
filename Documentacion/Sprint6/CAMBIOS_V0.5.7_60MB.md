# TimeFlow V0.5.7-SNAPSHOT

Sprint 6. Aumento del tamaño de evidencias a 60 MB por archivo.

- Interfaz: validación de tamaño y mensajes de 60 MB.
- Backend: validación de tamaño de 60 MB y solicitud multipart de hasta 61 MB.
- MySQL: se conserva LONGBLOB y se recomienda max_allowed_packet=128M.
- Total por tarea: 300 MB conservados, incluyendo evidencias desactivadas.
- Cantidad por tarea: hasta 25 archivos conservados.
- Resto de la API: continúa el límite de 4 MB.

La migración de tablas no cambia respecto de V0.5.6. La versión está pendiente de validación con MySQL y archivos reales.
