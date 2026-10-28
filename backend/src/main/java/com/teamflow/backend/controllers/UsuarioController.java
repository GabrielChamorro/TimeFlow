package com.teamflow.backend.controllers;

import com.teamflow.backend.models.Usuario;
import com.teamflow.backend.repositories.UsuarioRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    private static final int MAX_NOMBRE = 100;
    private static final int MAX_EMAIL = 150;
    private static final int MIN_PASSWORD = 8;
    private static final int MAX_PASSWORD = 64;
    private static final Pattern EMAIL_PATTERN = Pattern.compile(
            "^[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}$",
            Pattern.CASE_INSENSITIVE);

    private final UsuarioRepository usuarioRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    public UsuarioController(UsuarioRepository usuarioRepository, BCryptPasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping
    public ResponseEntity<List<Usuario>> listarUsuarios() {
        return ResponseEntity.ok(usuarioRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> obtenerUsuario(@PathVariable Long id) {
        return usuarioRepository.findById(id)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Usuario no encontrado")));
    }

    @PostMapping
    public ResponseEntity<?> crearUsuario(@RequestBody Usuario usuario) {
        String error = validarDatosBasicos(usuario);
        if (error != null) {
            return ResponseEntity.badRequest().body(Map.of("message", error));
        }

        String passwordError = validarPassword(usuario.getPassword(), true);
        if (passwordError != null) {
            return ResponseEntity.badRequest().body(Map.of("message", passwordError));
        }

        String email = usuario.getEmail().trim().toLowerCase();
        if (usuarioRepository.findByEmail(email).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "Ya existe un usuario con ese correo"));
        }

        usuario.setId(null);
        usuario.setNombre(usuario.getNombre().trim());
        usuario.setEmail(email);
        usuario.setRol(normalizarRol(usuario.getRol()));
        usuario.setEstado(normalizarEstado(usuario.getEstado()));
        usuario.setPasswordHash(passwordEncoder.encode(usuario.getPassword()));
        usuario.setPassword(null);

        Usuario creado = usuarioRepository.save(usuario);
        return ResponseEntity.status(HttpStatus.CREATED).body(creado);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizarUsuario(@PathVariable Long id, @RequestBody Usuario datos) {
        Optional<Usuario> existenteOpt = usuarioRepository.findById(id);
        if (existenteOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Usuario no encontrado"));
        }

        String error = validarDatosBasicos(datos);
        if (error != null) {
            return ResponseEntity.badRequest().body(Map.of("message", error));
        }

        if (datos.getPassword() != null && !datos.getPassword().isBlank()) {
            String passwordError = validarPassword(datos.getPassword(), false);
            if (passwordError != null) {
                return ResponseEntity.badRequest().body(Map.of("message", passwordError));
            }
        }

        String email = datos.getEmail().trim().toLowerCase();
        Optional<Usuario> usuarioConEmail = usuarioRepository.findByEmail(email);
        if (usuarioConEmail.isPresent() && !usuarioConEmail.get().getId().equals(id)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "Ya existe un usuario con ese correo"));
        }

        Usuario existente = existenteOpt.get();
        existente.setNombre(datos.getNombre().trim());
        existente.setEmail(email);
        existente.setRol(normalizarRol(datos.getRol()));
        existente.setEstado(normalizarEstado(datos.getEstado()));

        if (datos.getPassword() != null && !datos.getPassword().isBlank()) {
            existente.setPasswordHash(passwordEncoder.encode(datos.getPassword()));
        }
        existente.setPassword(null);

        return ResponseEntity.ok(usuarioRepository.save(existente));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminarUsuario(@PathVariable Long id) {
        if (!usuarioRepository.existsById(id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Usuario no encontrado"));
        }

        usuarioRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private String validarDatosBasicos(Usuario usuario) {
        if (usuario == null) {
            return "Los datos del usuario son obligatorios";
        }
        if (usuario.getNombre() == null || usuario.getNombre().isBlank()) {
            return "El nombre es obligatorio";
        }
        if (usuario.getNombre().trim().length() > MAX_NOMBRE) {
            return "El nombre no puede superar 100 caracteres";
        }
        if (usuario.getEmail() == null || usuario.getEmail().isBlank()) {
            return "El correo es obligatorio";
        }
        String email = usuario.getEmail().trim();
        if (email.length() > MAX_EMAIL || !EMAIL_PATTERN.matcher(email).matches()) {
            return "El correo no es válido";
        }
        if (usuario.getRol() != null
                && !usuario.getRol().isBlank()
                && !"admin".equalsIgnoreCase(usuario.getRol())
                && !"trabajador".equalsIgnoreCase(usuario.getRol())) {
            return "El rol indicado no es válido";
        }
        if (usuario.getEstado() != null
                && !usuario.getEstado().isBlank()
                && !"activo".equalsIgnoreCase(usuario.getEstado())
                && !"inactivo".equalsIgnoreCase(usuario.getEstado())) {
            return "El estado indicado no es válido";
        }
        return null;
    }

    private String validarPassword(String password, boolean obligatoria) {
        if (password == null || password.isBlank()) {
            return obligatoria ? "La contraseña es obligatoria" : null;
        }
        if (password.length() < MIN_PASSWORD) {
            return "La contraseña debe tener al menos 8 caracteres";
        }
        if (password.length() > MAX_PASSWORD) {
            return "La contraseña no puede superar 64 caracteres";
        }
        if (!password.matches(".*[A-Za-z].*") || !password.matches(".*\\d.*")) {
            return "La contraseña debe incluir al menos una letra y un número";
        }
        return null;
    }

    private String normalizarRol(String rol) {
        return "admin".equalsIgnoreCase(rol) ? "admin" : "trabajador";
    }

    private String normalizarEstado(String estado) {
        return "inactivo".equalsIgnoreCase(estado) ? "inactivo" : "activo";
    }
}
