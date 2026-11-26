-- TimeFlow V0.5.5. Desactivacion reversible.
-- Ejecutar despues del esquema V0.5.4. Se puede ejecutar varias veces.
-- No elimina ni modifica registros existentes. Todos conservan activo=1 por defecto.
USE teamflow_db;
SET @tf_col_1 = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
 WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='tareas' AND COLUMN_NAME='activo');
SET @tf_sql_1 = IF(@tf_col_1=0, 'ALTER TABLE tareas ADD COLUMN activo TINYINT(1) NOT NULL DEFAULT 1', 'SELECT 1');
PREPARE tf_stmt_1 FROM @tf_sql_1;
EXECUTE tf_stmt_1;
DEALLOCATE PREPARE tf_stmt_1;
SET @tf_col_2 = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
 WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='tipos_tarea' AND COLUMN_NAME='activo');
SET @tf_sql_2 = IF(@tf_col_2=0, 'ALTER TABLE tipos_tarea ADD COLUMN activo TINYINT(1) NOT NULL DEFAULT 1', 'SELECT 1');
PREPARE tf_stmt_2 FROM @tf_sql_2;
EXECUTE tf_stmt_2;
DEALLOCATE PREPARE tf_stmt_2;
SET @tf_col_3 = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
 WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='mensajes' AND COLUMN_NAME='activo');
SET @tf_sql_3 = IF(@tf_col_3=0, 'ALTER TABLE mensajes ADD COLUMN activo TINYINT(1) NOT NULL DEFAULT 1', 'SELECT 1');
PREPARE tf_stmt_3 FROM @tf_sql_3;
EXECUTE tf_stmt_3;
DEALLOCATE PREPARE tf_stmt_3;
SET @tf_col_4 = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
 WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='evidencias_tarea' AND COLUMN_NAME='activo');
SET @tf_sql_4 = IF(@tf_col_4=0, 'ALTER TABLE evidencias_tarea ADD COLUMN activo TINYINT(1) NOT NULL DEFAULT 1', 'SELECT 1');
PREPARE tf_stmt_4 FROM @tf_sql_4;
EXECUTE tf_stmt_4;
DEALLOCATE PREPARE tf_stmt_4;
