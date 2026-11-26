package com.teamflow.backend.security;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class SessionMaintenance {
    private final JdbcTemplate jdbc;
    private static final org.slf4j.Logger log=org.slf4j.LoggerFactory.getLogger(SessionMaintenance.class);
    public SessionMaintenance(JdbcTemplate jdbc) { this.jdbc=jdbc; }
    @Scheduled(fixedDelayString="${app.sessions.cleanup-ms:900000}",initialDelayString="${app.sessions.cleanup-ms:900000}")
    public void cleanExpired() {
        try {
            // Acotado e indexado; renovaciones se eliminan mediante FK ON DELETE CASCADE.
            jdbc.update("DELETE FROM sesiones_jwt WHERE expires_at_ms <= ? LIMIT 1000", System.currentTimeMillis());
        } catch (org.springframework.dao.DataAccessException ex) {
            log.warn("No se pudo completar la limpieza de sesiones caducadas; se reintentará");
        }
    }
}
