-- Backend detenido, respaldo previo y BD seleccionada. Aditiva e idempotente.
CREATE TABLE IF NOT EXISTS renovaciones_jwt (
 token_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
 session_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 used_at_ms BIGINT NULL,
 INDEX idx_renovaciones_sesion (session_hash),
 CONSTRAINT fk_renovacion_sesion FOREIGN KEY (session_hash) REFERENCES sesiones_jwt(session_hash) ON DELETE CASCADE
) ENGINE=InnoDB;
