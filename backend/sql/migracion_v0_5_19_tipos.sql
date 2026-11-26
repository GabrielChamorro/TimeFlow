-- V0.5.19: respaldo previo, backend detenido y BD seleccionada.
SET @tf_type_version=(SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='tipos_tarea' AND column_name='version');
SET @tf_type_sql=IF(@tf_type_version=0,'ALTER TABLE tipos_tarea ADD COLUMN version BIGINT NOT NULL DEFAULT 0','SELECT 1');
PREPARE tf_type_stmt FROM @tf_type_sql; EXECUTE tf_type_stmt; DEALLOCATE PREPARE tf_type_stmt;
