-- TimeFlow V0.5.8: varias dependencias por tarea (migración repetible).
-- Ejecutar con el backend APAGADO y despues de realizar un respaldo.
-- No borra tareas ni evidencias. Conserva los requisitos previos antiguos.
USE teamflow_db;
CREATE TABLE IF NOT EXISTS tarea_dependencias (
    tarea_id BIGINT NOT NULL,
    dependencia_id BIGINT NOT NULL,
    PRIMARY KEY (tarea_id, dependencia_id),
    INDEX idx_tarea_dependencias_previa (dependencia_id),
    CONSTRAINT fk_tarea_dependencias_tarea FOREIGN KEY (tarea_id)
        REFERENCES tareas(id) ON DELETE CASCADE
);
-- Las relaciones antiguas quedan migradas. INSERT IGNORE permite repetir el script.
INSERT IGNORE INTO tarea_dependencias (tarea_id, dependencia_id)
SELECT id, dependencia_id FROM tareas WHERE dependencia_id IS NOT NULL;
-- Evita que posteriores ejecuciones vuelvan a introducir relaciones eliminadas por el usuario.
-- El campo historico queda sin uso; la nueva version trabaja con tarea_dependencias.
UPDATE tareas SET dependencia_id = NULL WHERE dependencia_id IS NOT NULL;
