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
