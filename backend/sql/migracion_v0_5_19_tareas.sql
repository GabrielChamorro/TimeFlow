-- V0.5.19 tareas: aditiva e idempotente. Backend detenido y BD seleccionada.
SET @tf_version_exists=(SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='tareas' AND column_name='version');
SET @tf_version_sql=IF(@tf_version_exists=0,'ALTER TABLE tareas ADD COLUMN version BIGINT NOT NULL DEFAULT 0','SELECT 1');
PREPARE tf_version_stmt FROM @tf_version_sql;
EXECUTE tf_version_stmt;
DEALLOCATE PREPARE tf_version_stmt;
