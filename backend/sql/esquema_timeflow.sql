-- TimeFlow V0.4.11: no elimina tablas, filas ni contrasenas anteriores.
CREATE DATABASE IF NOT EXISTS teamflow_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE teamflow_db;
CREATE TABLE IF NOT EXISTS usuarios (
 id BIGINT AUTO_INCREMENT PRIMARY KEY, nombre VARCHAR(100) NOT NULL,
 email VARCHAR(150) NOT NULL UNIQUE, password_hash VARCHAR(255) NULL,
 rol VARCHAR(50) DEFAULT 'trabajador', estado VARCHAR(50) DEFAULT 'activo',
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS tareas (
 id BIGINT AUTO_INCREMENT PRIMARY KEY, codigo VARCHAR(50) UNIQUE NOT NULL,
 nombre VARCHAR(180) NOT NULL, descripcion TEXT, tipo VARCHAR(100) DEFAULT 'Custom',
 asignado_a VARCHAR(120) NOT NULL, asignado_usuario_id BIGINT NULL, fecha VARCHAR(20), fecha_inicio VARCHAR(50),
 fecha_fin VARCHAR(50), fecha_limite VARCHAR(50), meta VARCHAR(500),
 meta_cumplida BOOLEAN DEFAULT FALSE, estado VARCHAR(50) DEFAULT 'En Progreso',
 posicion_x DOUBLE, posicion_y DOUBLE, dependencia_id BIGINT NULL, bitacora TEXT, evidencia LONGTEXT, activo TINYINT(1) NOT NULL DEFAULT 1
);
SET @col_fecha=(SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='teamflow_db' AND TABLE_NAME='tareas' AND COLUMN_NAME='fecha');
SET @sql_fecha=IF(@col_fecha=0, 'ALTER TABLE tareas ADD COLUMN fecha VARCHAR(20)', 'SELECT 1');
PREPARE stmt_fecha FROM @sql_fecha; EXECUTE stmt_fecha; DEALLOCATE PREPARE stmt_fecha;
SET @col_px=(SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='teamflow_db' AND TABLE_NAME='tareas' AND COLUMN_NAME='posicion_x');
SET @sql_px=IF(@col_px=0, 'ALTER TABLE tareas ADD COLUMN posicion_x DOUBLE', 'SELECT 1');
PREPARE stmt_px FROM @sql_px; EXECUTE stmt_px; DEALLOCATE PREPARE stmt_px;
SET @col_py=(SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='teamflow_db' AND TABLE_NAME='tareas' AND COLUMN_NAME='posicion_y');
SET @sql_py=IF(@col_py=0, 'ALTER TABLE tareas ADD COLUMN posicion_y DOUBLE', 'SELECT 1');
PREPARE stmt_py FROM @sql_py; EXECUTE stmt_py; DEALLOCATE PREPARE stmt_py;
SET @col_hash=(SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='teamflow_db' AND TABLE_NAME='usuarios' AND COLUMN_NAME='password_hash');
SET @sql_hash=IF(@col_hash=0, 'ALTER TABLE usuarios ADD COLUMN password_hash VARCHAR(255) NULL', 'SELECT 1');
PREPARE stmt_hash FROM @sql_hash; EXECUTE stmt_hash; DEALLOCATE PREPARE stmt_hash;
UPDATE tareas SET fecha_limite=CONCAT(fecha, 'T', fecha_limite)
WHERE fecha IS NOT NULL AND fecha <> '' AND fecha_limite REGEXP '^[0-9]{2}:[0-9]{2}$';
CREATE TABLE IF NOT EXISTS jornadas (
 id BIGINT AUTO_INCREMENT PRIMARY KEY,
 usuario_id BIGINT NOT NULL, entrada DATETIME(6) NOT NULL,
 salida DATETIME(6) NULL, usuario_activo_id BIGINT NULL UNIQUE,
 INDEX idx_jornadas_usuario_entrada (usuario_id,entrada),
 CONSTRAINT fk_jornadas_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS tipos_tarea (
 id BIGINT AUTO_INCREMENT PRIMARY KEY, nombre VARCHAR(100) UNIQUE NOT NULL, descripcion TEXT, activo TINYINT(1) NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS mensajes (
 id BIGINT AUTO_INCREMENT PRIMARY KEY, chat_id VARCHAR(50), recipient_id BIGINT,
 sender_id BIGINT NOT NULL, sender_name VARCHAR(100) NOT NULL,
 sender_avatar VARCHAR(50), sender_role VARCHAR(50) NOT NULL,
 text TEXT NOT NULL, timestamp VARCHAR(50) NOT NULL, activo TINYINT(1) NOT NULL DEFAULT 1,
 INDEX idx_mensajes_chat_id (chat_id),
 INDEX idx_mensajes_sender_id (sender_id),
 INDEX idx_mensajes_recipient_id (recipient_id)
);

-- Identificador seguro del responsable (sin borrar tareas antiguas).
SET @col_responsable=(SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='tareas' AND COLUMN_NAME='asignado_usuario_id');
SET @sql_responsable=IF(@col_responsable=0, 'ALTER TABLE tareas ADD COLUMN asignado_usuario_id BIGINT NULL', 'SELECT 1');
PREPARE stmt_responsable FROM @sql_responsable; EXECUTE stmt_responsable; DEALLOCATE PREPARE stmt_responsable;
-- Vincula solo nombres unicos. Los nombres duplicados se revisan manualmente con un administrador.
UPDATE tareas t INNER JOIN (
    SELECT MIN(id) AS usuario_id, nombre
    FROM usuarios GROUP BY nombre HAVING COUNT(*) = 1
) u ON t.asignado_a = u.nombre
SET t.asignado_usuario_id = u.usuario_id
WHERE t.asignado_usuario_id IS NULL;

-- Nuevas funciones V0.5.4: dependencia opcional y archivos adjuntos.
SET @tiene_dep=(SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='tareas' AND COLUMN_NAME='dependencia_id');
SET @sql_dep=IF(@tiene_dep=0, 'ALTER TABLE tareas ADD COLUMN dependencia_id BIGINT NULL', 'SELECT 1');
PREPARE stmt_dep FROM @sql_dep; EXECUTE stmt_dep; DEALLOCATE PREPARE stmt_dep;
CREATE TABLE IF NOT EXISTS evidencias_tarea (
 id BIGINT AUTO_INCREMENT PRIMARY KEY, tarea_id BIGINT NOT NULL,
 nombre_original VARCHAR(200) NOT NULL, tipo_mime VARCHAR(100) NOT NULL,
 tamano_bytes BIGINT NOT NULL, fecha_subida DATETIME(6) NOT NULL,
 contenido LONGBLOB NOT NULL, activo TINYINT(1) NOT NULL DEFAULT 1,
 INDEX idx_evidencias_tarea (tarea_id),
 CONSTRAINT fk_evidencias_tarea FOREIGN KEY (tarea_id) REFERENCES tareas(id) ON DELETE CASCADE
);

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

-- Soporte de varias dependencias por tarea desde V0.5.8.
-- TimeFlow V0.5.8: varias dependencias por tarea (migración repetible).
-- Ejecutar con el backend APAGADO y despues de realizar un respaldo.
-- No borra tareas ni evidencias. Conserva los requisitos previos antiguos.
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

-- V0.5.19: ejecutar tras respaldar, con el backend detenido y la BD seleccionada.
-- Idempotente y aditiva: no modifica usuarios ni elimina datos existentes.
CREATE TABLE IF NOT EXISTS sesiones_jwt (
 session_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
 usuario_id BIGINT NOT NULL,
 expires_at_ms BIGINT NOT NULL,
 INDEX idx_sesiones_usuario (usuario_id),
 INDEX idx_sesiones_expiracion (expires_at_ms),
 CONSTRAINT fk_sesiones_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- V0.5.19 tareas: aditiva e idempotente. Backend detenido y BD seleccionada.
SET @tf_version_exists=(SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='tareas' AND column_name='version');
SET @tf_version_sql=IF(@tf_version_exists=0,'ALTER TABLE tareas ADD COLUMN version BIGINT NOT NULL DEFAULT 0','SELECT 1');
PREPARE tf_version_stmt FROM @tf_version_sql;
EXECUTE tf_version_stmt;
DEALLOCATE PREPARE tf_version_stmt;

-- Backend detenido, respaldo previo y BD seleccionada. Aditiva e idempotente.
CREATE TABLE IF NOT EXISTS renovaciones_jwt (
 token_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
 session_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 used_at_ms BIGINT NULL,
 INDEX idx_renovaciones_sesion (session_hash),
 CONSTRAINT fk_renovacion_sesion FOREIGN KEY (session_hash) REFERENCES sesiones_jwt(session_hash) ON DELETE CASCADE
) ENGINE=InnoDB;

-- V0.5.19: respaldo previo, backend detenido y BD seleccionada.
SET @tf_user_version=(SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='usuarios' AND column_name='version');
SET @tf_user_sql=IF(@tf_user_version=0,'ALTER TABLE usuarios ADD COLUMN version BIGINT NOT NULL DEFAULT 0','SELECT 1');
PREPARE tf_user_stmt FROM @tf_user_sql; EXECUTE tf_user_stmt; DEALLOCATE PREPARE tf_user_stmt;

-- V0.5.19: respaldo previo, backend detenido y BD seleccionada.
SET @tf_type_version=(SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='tipos_tarea' AND column_name='version');
SET @tf_type_sql=IF(@tf_type_version=0,'ALTER TABLE tipos_tarea ADD COLUMN version BIGINT NOT NULL DEFAULT 0','SELECT 1');
PREPARE tf_type_stmt FROM @tf_type_sql; EXECUTE tf_type_stmt; DEALLOCATE PREPARE tf_type_stmt;

-- Backend detenido; respaldo previo y base seleccionada. Aditiva e idempotente.
-- La bitácora anterior permanece intacta: no se inventan sus fechas ni autores.
CREATE TABLE IF NOT EXISTS tarea_registros (
 id BIGINT AUTO_INCREMENT PRIMARY KEY,
 tarea_id BIGINT NOT NULL,
 autor_id BIGINT NULL,
 autor_nombre VARCHAR(100) NULL,
 tipo VARCHAR(20) NOT NULL,
 contenido TEXT NOT NULL,
 creado_en_ms BIGINT NULL,
 INDEX idx_registros_tarea_tipo_fecha (tarea_id,tipo,creado_en_ms,id),
 CONSTRAINT fk_registros_tarea FOREIGN KEY (tarea_id) REFERENCES tareas(id),
 CONSTRAINT fk_registros_autor FOREIGN KEY (autor_id) REFERENCES usuarios(id)
) ENGINE=InnoDB;

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
