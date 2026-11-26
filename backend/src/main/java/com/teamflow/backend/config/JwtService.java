package com.teamflow.backend.config;

import com.teamflow.backend.models.Usuario;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Arrays;
import java.util.Base64;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.util.Date;
import java.util.function.Function;

@Service
public class JwtService {

    private final String secretKey;
    private final long expirationTime;
    private final com.teamflow.backend.security.SessionRegistry sessions;

    public JwtService(
            @Value("${jwt.secret}") String secretKey,
            @Value("${jwt.expiration-ms:86400000}") long expirationTime, com.teamflow.backend.security.SessionRegistry sessions) {
        if (secretKey == null || secretKey.isBlank() || secretKey.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException("JWT_SECRET debe tener al menos 32 bytes y no puede estar vacío");
        }
        if (expirationTime <= 0) {
            throw new IllegalStateException("jwt.expiration-ms debe ser mayor que cero");
        }
        this.sessions = sessions;
        this.secretKey = secretKey;
        this.expirationTime = expirationTime;
    }

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(secretKey.getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(Usuario usuario) {
        String sid=java.util.UUID.randomUUID().toString();
        String token=generateTokenForSession(usuario,sid);
        sessions.register(sid,usuario.getId(),System.currentTimeMillis()+expirationTime);
        return token;
    }
    public String generateTokenForSession(Usuario usuario, String jti) {
        long expiresAt = System.currentTimeMillis() + expirationTime;
        String token = Jwts.builder()
                .id(jti)
                .subject(usuario.getEmail())
                .claim("id", usuario.getId())
                .claim("nombre", usuario.getNombre())
                .claim("rol", usuario.getRol())
                .claim("credentialsVersion", credentialsVersion(usuario))
                .issuedAt(new Date())
                .expiration(new Date(expiresAt))
                .signWith(getSigningKey())
                .compact();
        return token;
    }

    public void revokeToken(String token) {
        sessions.revoke(extractClaim(token, Claims::getId));
    }

    public String extractEmail(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public boolean isTokenValid(String token, Usuario usuario) {
        String email = extractEmail(token);
        // El correo puede cambiar de propietario. Vincular el JWT al ID real de la cuenta.
        Object claimId = extractClaim(token, claims -> claims.get("id"));
        String tokenVersion = extractClaim(token, claims -> claims.get("credentialsVersion", String.class));
        String currentVersion = credentialsVersion(usuario);
        return email != null
                && tokenVersion != null
                && MessageDigest.isEqual(tokenVersion.getBytes(StandardCharsets.UTF_8), currentVersion.getBytes(StandardCharsets.UTF_8))
                && email.equalsIgnoreCase(usuario.getEmail())
                && claimId instanceof Number
                && usuario.getId() != null
                && ((Number) claimId).longValue() == usuario.getId().longValue()
                && !isTokenExpired(token)
                && sessions.isActive(extractClaim(token, Claims::getId), usuario.getId());
    }

    // El token no incluye el hash de contraseña. Esta marca HMAC cambia si cambia
    // la contraseña y permite invalidar los tokens previos sin migrar la BD.
    private String credentialsVersion(Usuario usuario) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secretKey.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] data = (usuario.getPasswordHash() == null ? "" : usuario.getPasswordHash())
                    .getBytes(StandardCharsets.UTF_8);
            return Base64.getUrlEncoder().withoutPadding()
                    .encodeToString(Arrays.copyOf(mac.doFinal(data), 16));
        } catch (java.security.GeneralSecurityException ex) {
            throw new IllegalStateException("No se pudo proteger la sesión", ex);
        }
    }

    private boolean isTokenExpired(String token) {
        Date expiration = extractClaim(token, Claims::getExpiration);
        return expiration.before(new Date());
    }

    private <T> T extractClaim(String token, Function<Claims, T> resolver) {
        Claims claims = Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
        return resolver.apply(claims);
    }
}
