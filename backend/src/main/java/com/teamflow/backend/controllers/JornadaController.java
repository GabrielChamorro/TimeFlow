package com.teamflow.backend.controllers;

import com.teamflow.backend.dto.JornadaResponse;
import com.teamflow.backend.models.Usuario;
import com.teamflow.backend.repositories.UsuarioRepository;
import com.teamflow.backend.services.JornadaService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/jornadas")
public class JornadaController {
    private final JornadaService jornadas;
    private final UsuarioRepository usuarios;

    public JornadaController(JornadaService jornadas, UsuarioRepository usuarios) {
        this.jornadas = jornadas;
        this.usuarios = usuarios;
    }

    @GetMapping("/actual")
    public ResponseEntity<?> actual(Authentication auth) {
        Usuario usuario = autenticado(auth);
        if (usuario == null) return sinSesion();
        // 204 significa que el usuario todavía no tiene registros de jornada.
        return jornadas.obtenerUltima(usuario.getId())
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @PostMapping("/check-in")
    public ResponseEntity<?> checkIn(Authentication auth) {
        Usuario usuario = autenticado(auth);
        if (usuario == null) return sinSesion();
        return jornadas.registrarEntrada(usuario.getId())
                .<ResponseEntity<?>>map(j -> ResponseEntity.status(HttpStatus.CREATED).body(j))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(Map.of("message", "Ya tienes una jornada activa")));
    }

    @PostMapping("/check-out")
    public ResponseEntity<?> checkOut(Authentication auth) {
        Usuario usuario = autenticado(auth);
        if (usuario == null) return sinSesion();
        return jornadas.registrarSalida(usuario.getId())
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(Map.of("message", "No tienes una jornada activa para registrar salida")));
    }

    private Usuario autenticado(Authentication auth) {
        return auth == null ? null : usuarios.findByEmail(auth.getName()).orElse(null);
    }

    private ResponseEntity<?> sinSesion() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Sesión inválida"));
    }
}
