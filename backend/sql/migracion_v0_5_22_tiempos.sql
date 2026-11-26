-- V0.5.22. Backend detenido y respaldo previo. Aplicar después de las dos migraciones V0.5.21.
-- NULL conserva las tareas antiguas sin duración verificable. No hay backfill de fechas HH:mm.
SET @tf22_column=(SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='tareas' AND column_name='tiempo_acumulado_ms');
SET @tf22_sql=IF(@tf22_column=0,'ALTER TABLE tareas ADD COLUMN tiempo_acumulado_ms BIGINT NULL','SELECT 1');
PREPARE tf22_stmt FROM @tf22_sql; EXECUTE tf22_stmt; DEALLOCATE PREPARE tf22_stmt;
SET @tf22_column=(SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='tareas' AND column_name='tiempo_inicio_ms');
SET @tf22_sql=IF(@tf22_column=0,'ALTER TABLE tareas ADD COLUMN tiempo_inicio_ms BIGINT NULL','SELECT 1');
PREPARE tf22_stmt FROM @tf22_sql; EXECUTE tf22_stmt; DEALLOCATE PREPARE tf22_stmt;
-- MAX(id) por tarea para detectar notas nuevas sin descargar sus contenidos ni evidencias.
SET @tf22_index=(SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name='tarea_registros' AND index_name='idx_registros_tarea_id');
SET @tf22_sql=IF(@tf22_index=0,'CREATE INDEX idx_registros_tarea_id ON tarea_registros(tarea_id,id)','SELECT 1');
PREPARE tf22_stmt FROM @tf22_sql; EXECUTE tf22_stmt; DEALLOCATE PREPARE tf22_stmt;
