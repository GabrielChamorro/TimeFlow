-- Aditiva y repetible; respaldo previo, backend detenido y base seleccionada.
-- Los cierres antiguos sin fecha verificable se conservan como NULL.
SET @tf21_column=(SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='tareas' AND column_name='finalizada_en_ms');
SET @tf21_sql=IF(@tf21_column=0,'ALTER TABLE tareas ADD COLUMN finalizada_en_ms BIGINT NULL','SELECT 1');
PREPARE tf21_stmt FROM @tf21_sql; EXECUTE tf21_stmt; DEALLOCATE PREPARE tf21_stmt;
SET @tf21_index=(SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name='tareas' AND index_name='idx_tareas_historial');
SET @tf21_sql=IF(@tf21_index=0,'CREATE INDEX idx_tareas_historial ON tareas(estado,activo,finalizada_en_ms,id)','SELECT 1');
PREPARE tf21_stmt FROM @tf21_sql; EXECUTE tf21_stmt; DEALLOCATE PREPARE tf21_stmt;
SET @tf21_index=(SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name='tareas' AND index_name='idx_tareas_historial_responsable');
SET @tf21_sql=IF(@tf21_index=0,'CREATE INDEX idx_tareas_historial_responsable ON tareas(asignado_usuario_id,estado,activo,finalizada_en_ms,id)','SELECT 1');
PREPARE tf21_stmt FROM @tf21_sql; EXECUTE tf21_stmt; DEALLOCATE PREPARE tf21_stmt;
