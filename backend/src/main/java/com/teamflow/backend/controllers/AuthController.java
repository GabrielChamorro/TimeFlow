package com.teamflow.backend.controllers;

import com.teamflow.backend.config.JwtService;
import com.teamflow.backend.models.Usuario;
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

    private static final int MAX_EMAIL = 150;
    private static final int MAX_PASSWORD = 64;
    private static final Pattern EMAIL_PATTERN = Pattern.compile(
            "^[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}$",
            Pattern.CASE_INSENSITIVE);

    private final UsuarioRepository usuarioRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthController(
            UsuarioRepository usuarioRepository,
            BCryptPasswordEncoder passwordEncoder,
            JwtService jwtService) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        String email = request == null ? null : request.get("email");
        String password = request == null ? null : request.get("password");

        if (email == null || email.isBlank() || password == null || password.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Correo y contraseña son obligatorios"));
        }

        email = email.trim().toLowerCase();
        if (email.length() > MAX_EMAIL || !EMAIL_PATTERN.matcher(email).matches() || password.length() > MAX_PASSWORD) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Credenciales incorrectas"));
        }

        Optional<Usuario> userOpt = usuarioRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
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

        String token = jwtService.generateToken(usuario);
        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("user", usuario);
        return ResponseEntity.ok(response);
    }
}
