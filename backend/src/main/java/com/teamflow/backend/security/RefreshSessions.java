package com.teamflow.backend.security;

import com.teamflow.backend.models.Usuario;
import com.teamflow.backend.repositories.UsuarioRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Isolation;
import java.security.SecureRandom;
import java.util.*;

@Service
public class RefreshSessions {
    public record Issued(String sessionId, String refresh, long expiresAt, Usuario user) {}
    public record Rotation(int status, Issued issued) {}
    private final JdbcTemplate jdbc;
    private final UsuarioRepository users;
    private final SessionRegistry sessions;
    private final long lifetime;
    private final SecureRandom random = new SecureRandom();
    public RefreshSessions(JdbcTemplate jdbc, UsuarioRepository users, SessionRegistry sessions,
            @Value("${app.auth.refresh-ms:2592000000}") long lifetime) {
        if (lifetime < 1000 || lifetime > 2592000000L) throw new IllegalArgumentException("DuraciÃ³n de sesiÃ³n invÃ¡lida");
        this.jdbc=jdbc; this.users=users; this.sessions=sessions; this.lifetime=lifetime;
    }
    private String newToken(String sid) {
        byte[] bytes=new byte[32]; random.nextBytes(bytes);
        return sid+"."+Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
    private void insert(String token, String sid) {
        jdbc.update("INSERT INTO renovaciones_jwt (token_hash, session_hash) VALUES (?,?)",
                SessionRegistry.digest(token), SessionRegistry.digest(sid));
    }
    @Transactional(isolation=Isolation.READ_COMMITTED)
    public Issued create(Usuario user) {
        String sid=UUID.randomUUID().toString(), token=newToken(sid);
        long expiry=System.currentTimeMillis()+lifetime;
        sessions.register(sid,user.getId(),expiry); insert(token,sid);
        return new Issued(sid,token,expiry,user);
    }
    private boolean validFormat(String token) {
        return token != null && token.matches("[0-9a-f-]{36}\\.[A-Za-z0-9_-]{43}");
    }
    @Transactional(isolation=Isolation.READ_COMMITTED)
    public Rotation rotate(String token) {
        if (!validFormat(token)) return new Rotation(401,null);
        String hash=SessionRegistry.digest(token), sid=token.substring(0,36);
        var owners=jdbc.queryForList("SELECT s.usuario_id FROM renovaciones_jwt r JOIN sesiones_jwt s ON s.session_hash=r.session_hash WHERE r.token_hash=?",Long.class,hash);
        if (owners.isEmpty()) return new Rotation(401,null);
        // Orden comÃºn: usuario -> sesiÃ³n. Serializa con contraseÃ±a, baja y login.
        Usuario user=users.findByIdForUpdate(owners.getFirst()).orElse(null);
        var rows=jdbc.queryForList("SELECT r.used_at_ms,s.expires_at_ms FROM renovaciones_jwt r JOIN sesiones_jwt s ON s.session_hash=r.session_hash WHERE r.token_hash=? AND s.session_hash=? FOR UPDATE",hash,SessionRegistry.digest(sid));
        if (rows.isEmpty()) return new Rotation(401,null);
        long now=System.currentTimeMillis(); var row=rows.getFirst();
        if (user==null || "inactivo".equalsIgnoreCase(user.getEstado()) || ((Number)row.get("expires_at_ms")).longValue()<=now) {
            sessions.revoke(sid); return new Rotation(401,null);
        }
        Number used=(Number)row.get("used_at_ms");
        if (used!=null) {
            // Una peticiÃ³n duplicada reciente no recibe credenciales ni invalida al ganador.
            // Pasados 5 s se considera reutilizaciÃ³n: revoca toda la familia, incluidos JWT.
            if (now-used.longValue()<5000) return new Rotation(409,null);
            sessions.revoke(sid); return new Rotation(401,null);
        }
        jdbc.update("UPDATE renovaciones_jwt SET used_at_ms=? WHERE token_hash=?",now,hash);
        String next=newToken(sid); insert(next,sid);
        return new Rotation(200,new Issued(sid,next,((Number)row.get("expires_at_ms")).longValue(),user));
    }
    @Transactional(isolation=Isolation.READ_COMMITTED)
    public void logout(String token) {
        if (!validFormat(token)) return;
        var owners=jdbc.queryForList("SELECT s.usuario_id FROM renovaciones_jwt r JOIN sesiones_jwt s ON s.session_hash=r.session_hash WHERE r.token_hash=?",Long.class,SessionRegistry.digest(token));
        if (!owners.isEmpty()) {
            users.findByIdForUpdate(owners.getFirst());
            sessions.revoke(token.substring(0,36));
        }
    }
}
