-- Sprint 5: ejecutar manualmente DESPUES de respaldar teamflow_db.
-- No borra datos y se puede ejecutar varias veces en MySQL 8.4.
-- Los indices sirven al filtro de mensajes por canal, remitente y destinatario.
USE teamflow_db;

SET @idx = (SELECT COUNT(*) FROM information_schema.statistics
            WHERE table_schema = DATABASE() AND table_name = 'mensajes'
              AND index_name = 'idx_mensajes_chat_id');
SET @sql = IF(@idx = 0,
    'ALTER TABLE mensajes ADD INDEX idx_mensajes_chat_id (chat_id)',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx = (SELECT COUNT(*) FROM information_schema.statistics
            WHERE table_schema = DATABASE() AND table_name = 'mensajes'
              AND index_name = 'idx_mensajes_sender_id');
SET @sql = IF(@idx = 0,
    'ALTER TABLE mensajes ADD INDEX idx_mensajes_sender_id (sender_id)',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx = (SELECT COUNT(*) FROM information_schema.statistics
            WHERE table_schema = DATABASE() AND table_name = 'mensajes'
              AND index_name = 'idx_mensajes_recipient_id');
SET @sql = IF(@idx = 0,
    'ALTER TABLE mensajes ADD INDEX idx_mensajes_recipient_id (recipient_id)',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
