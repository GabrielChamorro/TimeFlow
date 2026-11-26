package com.teamflow.backend.security;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;

/** Allowlist persistente: solo se conserva SHA-256 del jti aleatorio firmado, nunca el JWT. */
@Service
public class SessionRegistry {
    private final JdbcTemplate jdbc;
    public SessionRegistry(JdbcTemplate jdbc) { this.jdbc = jdbc; }
    static String digest(String jti) {
        try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                .digest(jti.getBytes(StandardCharsets.UTF_8))); }
        catch (java.security.NoSuchAlgorithmException ex) { throw new IllegalStateException(ex); }
    }
    public void register(String jti, Long userId, long expiresAt) {
        // Limpieza acotada, indexada; no depende de la hora/zona de MySQL.
        jdbc.update("DELETE FROM sesiones_jwt WHERE expires_at_ms <= ? LIMIT 100", System.currentTimeMillis());
        jdbc.update("INSERT INTO sesiones_jwt (session_hash, usuario_id, expires_at_ms) VALUES (?, ?, ?)",
                digest(jti), userId, expiresAt);
    }
    public boolean isActive(String jti, Long userId) {
        if (jti == null || jti.isBlank() || userId == null) return false;
        return Integer.valueOf(1).equals(jdbc.queryForObject(
                "SELECT COUNT(*) FROM sesiones_jwt WHERE session_hash=? AND usuario_id=? AND expires_at_ms>?",
                Integer.class, digest(jti), userId, System.currentTimeMillis()));
    }
    public void revoke(String jti) {
        if (jti != null && !jti.isBlank()) jdbc.update("DELETE FROM sesiones_jwt WHERE session_hash=?", digest(jti));
    }
    public void revokeAll(Long userId) {
        jdbc.update("DELETE FROM sesiones_jwt WHERE usuario_id=?", userId);
    }
}
