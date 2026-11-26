-- V0.5.19: respaldo previo, backend detenido y BD seleccionada.
SET @tf_user_version=(SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='usuarios' AND column_name='version');
SET @tf_user_sql=IF(@tf_user_version=0,'ALTER TABLE usuarios ADD COLUMN version BIGINT NOT NULL DEFAULT 0','SELECT 1');
PREPARE tf_user_stmt FROM @tf_user_sql; EXECUTE tf_user_stmt; DEALLOCATE PREPARE tf_user_stmt;
