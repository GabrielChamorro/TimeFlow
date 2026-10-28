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
 asignado_a VARCHAR(120) NOT NULL, fecha VARCHAR(20), fecha_inicio VARCHAR(50),
 fecha_fin VARCHAR(50), fecha_limite VARCHAR(50), meta VARCHAR(500),
 meta_cumplida BOOLEAN DEFAULT FALSE, estado VARCHAR(50) DEFAULT 'En Progreso',
 posicion_x DOUBLE, posicion_y DOUBLE, bitacora TEXT, evidencia LONGTEXT
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
 id BIGINT AUTO_INCREMENT PRIMARY KEY, nombre VARCHAR(100) UNIQUE NOT NULL, descripcion TEXT
);
CREATE TABLE IF NOT EXISTS mensajes (
 id BIGINT AUTO_INCREMENT PRIMARY KEY, chat_id VARCHAR(50), recipient_id BIGINT,
 sender_id BIGINT NOT NULL, sender_name VARCHAR(100) NOT NULL,
 sender_avatar VARCHAR(50), sender_role VARCHAR(50) NOT NULL,
 text TEXT NOT NULL, timestamp VARCHAR(50) NOT NULL
);
