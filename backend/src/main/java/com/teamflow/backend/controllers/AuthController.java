package com.teamflow.backend.controllers;

import com.teamflow.backend.config.JwtService;
import com.teamflow.backend.models.Usuario;
import com.teamflow.backend.security.LoginAttemptLimiter;
import com.teamflow.backend.repositories.UsuarioRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@CookieValue(name=COOKIE,required=false) String token,
            @RequestHeader(name="Authorization",required=false) String authorization,
            jakarta.servlet.http.HttpServletResponse response) {
        refreshSessions.logout(token);
        if (authorization!=null && authorization.startsWith("Bearer ")) {
            try { jwtService.revokeToken(authorization.substring(7)); }
            catch (io.jsonwebtoken.JwtException | IllegalArgumentException ignored) { /* cookie válida basta */ }
        }
        cookie(response,"",0);
        return ResponseEntity.noContent().build();
    }

    private static final int MAX_EMAIL = 150;
    private static final int MAX_PASSWORD = 64;
    private static final Pattern EMAIL_PATTERN = Pattern.compile(
            "^[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}$",
            Pattern.CASE_INSENSITIVE);

    private final UsuarioRepository usuarioRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final LoginAttemptLimiter loginLimiter;
    private final String dummyPasswordHash;
    private final com.teamflow.backend.security.RefreshSessions refreshSessions;
    private final boolean localHttp;
    private static final String COOKIE="tf_refresh";
    private void cookie(jakarta.servlet.http.HttpServletResponse response, String value, long maxAge) {
        response.addHeader("Set-Cookie",org.springframework.http.ResponseCookie.from(COOKIE,value)
                .httpOnly(true).secure(!localHttp).sameSite("Strict").path("/api/auth")
                .maxAge(Math.max(0,maxAge)).build().toString());
        response.setHeader("Cache-Control","no-store");
    }
    private Map<String,Object> payload(com.teamflow.backend.security.RefreshSessions.Issued issued) {
        return Map.of("token",jwtService.generateTokenForSession(issued.user(),issued.sessionId()),"user",issued.user());
    }
    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@CookieValue(name=COOKIE,required=false) String token,
                                    jakarta.servlet.http.HttpServletResponse response) {
        var result=refreshSessions.rotate(token);
        if (result.status()!=200) {
            if (result.status()==401) cookie(response,"",0);
            return ResponseEntity.status(result.status()).body(Map.of("message", result.status()==409 ? "Renovación simultánea; reintenta" : "Sesión expirada o revocada"));
        }
        var issued=result.issued();
        cookie(response,issued.refresh(),(issued.expiresAt()-System.currentTimeMillis())/1000);
        return ResponseEntity.ok().cacheControl(org.springframework.http.CacheControl.noStore()).body(payload(issued));
    }

    public AuthController(
            UsuarioRepository usuarioRepository,
            BCryptPasswordEncoder passwordEncoder,
            JwtService jwtService,
            LoginAttemptLimiter loginLimiter,
            com.teamflow.backend.security.RefreshSessions refreshSessions,
            @org.springframework.beans.factory.annotation.Value("${app.auth.local-http:false}") boolean localHttp) {
        this.refreshSessions=refreshSessions; this.localHttp=localHttp;
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.loginLimiter = loginLimiter;
        // Una contraseña ficticia para igualar el costo BCrypt en correos inexistentes.
        this.dummyPasswordHash = passwordEncoder.encode("TimeFlow-No-Account-Timing-Guard");
    }

    @org.springframework.transaction.annotation.Transactional(isolation = org.springframework.transaction.annotation.Isolation.READ_COMMITTED)
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request,
                                  jakarta.servlet.http.HttpServletRequest httpRequest, jakarta.servlet.http.HttpServletResponse httpResponse) {
        String email = request == null ? null : request.get("email");
        String password = request == null ? null : request.get("password");

        if (email == null || email.isBlank() || password == null || password.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Correo y contraseña son obligatorios"));
        }

        email = email.trim().toLowerCase(java.util.Locale.ROOT);
        String ip = httpRequest == null ? "sin-ip" : httpRequest.getRemoteAddr();
        if (!loginLimiter.admitir(email, ip)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(Map.of("message", "Demasiados intentos. Inténtalo más tarde"));
        }
        if (email.length() > MAX_EMAIL || !EMAIL_PATTERN.matcher(email).matches() || password.length() > MAX_PASSWORD
                || password.getBytes(java.nio.charset.StandardCharsets.UTF_8).length > 72) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Credenciales incorrectas"));
        }

        Optional<Usuario> userOpt = usuarioRepository.findByEmailForUpdate(email);
        if (userOpt.isEmpty()) {
            // Evita que el tiempo de respuesta revele cuentas registradas.
            if (dummyPasswordHash != null) passwordEncoder.matches(password, dummyPasswordHash);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Credenciales incorrectas"));
        }

        Usuario usuario = userOpt.get();
        boolean cuentaActiva = !"inactivo".equalsIgnoreCase(usuario.getEstado());
        boolean coincide = usuario.getPasswordHash() != null
                && usuario.getPasswordHash().startsWith("$2")
                && passwordEncoder.matches(password, usuario.getPasswordHash());

        // Evita distinguir por respuesta si un correo existe pero la cuenta está desactivada.
        if (!cuentaActiva || !coincide) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Credenciales incorrectas"));
        }

        // Si el hash fue creado con un costo BCrypt anterior, se actualiza al costo actual
        // sin pedir una contraseña nueva al usuario.
        if (passwordEncoder.upgradeEncoding(usuario.getPasswordHash())) {
            usuario.setPasswordHash(passwordEncoder.encode(password));
            usuarioRepository.save(usuario);
        }

        loginLimiter.registrarExitoReservado(email, ip);
        var issued=refreshSessions.create(usuario);
        cookie(httpResponse,issued.refresh(),(issued.expiresAt()-System.currentTimeMillis())/1000);
        Map<String,Object> response=payload(issued);
        return ResponseEntity.ok().cacheControl(org.springframework.http.CacheControl.noStore()).body(response);
    }
}
