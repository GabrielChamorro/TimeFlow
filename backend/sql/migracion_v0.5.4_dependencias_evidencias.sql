-- Ejecutar UNA VEZ en la base teamflow_db antes de usar V0.5.4.
-- No borra ni modifica tareas existentes.
USE teamflow_db;
SET @tiene_dep=(SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='tareas' AND COLUMN_NAME='dependencia_id');
SET @sql_dep=IF(@tiene_dep=0, 'ALTER TABLE tareas ADD COLUMN dependencia_id BIGINT NULL', 'SELECT 1');
PREPARE stmt_dep FROM @sql_dep; EXECUTE stmt_dep; DEALLOCATE PREPARE stmt_dep;
CREATE TABLE IF NOT EXISTS evidencias_tarea (
 id BIGINT AUTO_INCREMENT PRIMARY KEY, tarea_id BIGINT NOT NULL,
 nombre_original VARCHAR(200) NOT NULL, tipo_mime VARCHAR(100) NOT NULL,
 tamano_bytes BIGINT NOT NULL, fecha_subida DATETIME(6) NOT NULL,
 contenido LONGBLOB NOT NULL,
 INDEX idx_evidencias_tarea (tarea_id),
 CONSTRAINT fk_evidencias_tarea FOREIGN KEY (tarea_id) REFERENCES tareas(id) ON DELETE CASCADE
);
