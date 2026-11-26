package com.teamflow.backend.controllers;

import com.teamflow.backend.models.Usuario;
import com.teamflow.backend.dto.UsuarioDirectorio;
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
    private final com.teamflow.backend.security.SessionRegistry sessions;

    public UsuarioController(UsuarioRepository usuarioRepository, BCryptPasswordEncoder passwordEncoder, com.teamflow.backend.security.SessionRegistry sessions) {
        this.sessions = sessions;
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping
    public ResponseEntity<?> listarUsuarios(org.springframework.security.core.Authentication autenticacion) {
        if (autenticacion == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        List<Usuario> visibles = usuarioRepository.findVisibles();
        if (esAdministrador(autenticacion)) return ResponseEntity.ok(visibles);
        return ResponseEntity.ok(visibles.stream().map(UsuarioDirectorio::from).toList());
    }

    // Administración: incluye cuentas inactivas para permitir recuperarlas.
    @GetMapping("/administracion")
    public ResponseEntity<?> listarAdministracion(org.springframework.security.core.Authentication autenticacion) {
        if (!esAdministrador(autenticacion)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "No tienes permisos para consultar esta lista"));
        }
        return ResponseEntity.ok(usuarioRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> obtenerUsuario(@PathVariable Long id,
                                           org.springframework.security.core.Authentication autenticacion) {
        if (autenticacion == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        Usuario usuario = usuarioRepository.findById(id)
                .filter(u -> !"inactivo".equalsIgnoreCase(u.getEstado())).orElse(null);
        if (usuario == null) return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("message", "Usuario no encontrado"));
        if (esAdministrador(autenticacion) || usuario.getEmail().equalsIgnoreCase(autenticacion.getName()))
            return ResponseEntity.ok(usuario);
        return ResponseEntity.ok(UsuarioDirectorio.from(usuario));
    }

    private boolean esAdministrador(org.springframework.security.core.Authentication auth) {
        return auth != null && auth.getAuthorities() != null && auth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
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
        usuario.setVersion(null);
        usuario.setNombre(usuario.getNombre().trim());
        usuario.setEmail(email);
        usuario.setRol(normalizarRol(usuario.getRol()));
        usuario.setEstado(normalizarEstado(usuario.getEstado()));
        usuario.setPasswordHash(passwordEncoder.encode(usuario.getPassword()));
        usuario.setPassword(null);

        Usuario creado = usuarioRepository.save(usuario);
        return ResponseEntity.status(HttpStatus.CREATED).body(creado);
    }

    @org.springframework.transaction.annotation.Transactional(isolation = org.springframework.transaction.annotation.Isolation.READ_COMMITTED)
    @PutMapping("/{id}")
    public ResponseEntity<?> actualizarUsuario(@PathVariable Long id, @RequestBody Usuario datos,
                                                org.springframework.security.core.Authentication autenticacion) {
        Optional<Usuario> existenteOpt = usuarioRepository.findByIdForUpdate(id);
        if (existenteOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Usuario no encontrado"));
        }

        if (datos==null) return ResponseEntity.badRequest().body(Map.of("message","Los datos del usuario son obligatorios"));
        Usuario actual = existenteOpt.get();
        if ("inactivo".equalsIgnoreCase(actual.getEstado()) || !java.util.Objects.equals(actual.getVersion(),datos.getVersion())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", "Otra sesión modificó o desactivó esta cuenta. Tu borrador se conserva; revisa los datos actuales."));
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
        // Evita perder accidentalmente el único acceso administrativo del propio usuario.
        if (autenticacion != null && existente.getEmail().equalsIgnoreCase(autenticacion.getName())
                && (!"admin".equalsIgnoreCase(normalizarRol(datos.getRol()))
                    || "inactivo".equalsIgnoreCase(normalizarEstado(datos.getEstado())))) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "No puedes quitarte el rol administrador ni desactivar tu propia cuenta"));
        }
        boolean invalidar = (datos.getPassword() != null && !datos.getPassword().isBlank())
                || !existente.getEmail().equalsIgnoreCase(email)
                || !java.util.Objects.equals(existente.getRol(), normalizarRol(datos.getRol()))
                || "inactivo".equalsIgnoreCase(normalizarEstado(datos.getEstado()));
        if (invalidar) sessions.revokeAll(id);
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

    @org.springframework.transaction.annotation.Transactional(isolation = org.springframework.transaction.annotation.Isolation.READ_COMMITTED)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminarUsuario(@PathVariable Long id, org.springframework.security.core.Authentication autenticacion, @RequestParam(required=false) Long version) {
        Usuario usuario = usuarioRepository.findByIdForUpdate(id).orElse(null);
        if (usuario == null || "inactivo".equalsIgnoreCase(usuario.getEstado())) {
            return ResponseEntity.notFound().build();
        }
        // No permitimos que el administrador desactive su propia cuenta por accidente.
        if (autenticacion != null && usuario.getEmail().equalsIgnoreCase(autenticacion.getName())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "No puedes desactivar tu propia cuenta"));
        }
        if (version != null && !java.util.Objects.equals(version,usuario.getVersion()))
            return ResponseEntity.status(409).body(Map.of("message","Otra sesión modificó la cuenta. Actualiza el directorio y vuelve a revisar la confirmación."));
        sessions.revokeAll(id);
        usuario.setEstado("inactivo");
        usuarioRepository.save(usuario);
        return ResponseEntity.noContent().build();
    }

    @org.springframework.transaction.annotation.Transactional(isolation = org.springframework.transaction.annotation.Isolation.READ_COMMITTED)
    @PatchMapping("/{id}/reactivar")
    public ResponseEntity<?> reactivarUsuario(@PathVariable Long id) {
        Usuario usuario = usuarioRepository.findByIdForUpdate(id).orElse(null);
        if (usuario == null || !"inactivo".equalsIgnoreCase(usuario.getEstado())) {
            return ResponseEntity.notFound().build();
        }
        sessions.revokeAll(id);
        usuario.setEstado("activo");
        return ResponseEntity.ok(usuarioRepository.save(usuario));
    }

    @ExceptionHandler(org.springframework.dao.DataIntegrityViolationException.class)
    public ResponseEntity<?> conflictoDeDatos() {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("message", "No se pudo completar el cambio: ya existe un registro con esos datos o hay una restricción de base de datos"));
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
        if (password.getBytes(java.nio.charset.StandardCharsets.UTF_8).length > 72) {
            return "La contraseña no puede superar 72 bytes UTF-8";
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
