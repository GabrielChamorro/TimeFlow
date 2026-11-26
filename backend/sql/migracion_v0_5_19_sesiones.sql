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
