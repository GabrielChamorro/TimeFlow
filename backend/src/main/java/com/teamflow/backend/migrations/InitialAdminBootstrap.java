package com.teamflow.backend.migrations;

import com.teamflow.backend.models.Usuario;
import com.teamflow.backend.repositories.UsuarioRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.regex.Pattern;

/**
 * Crea una cuenta administrador solo cuando la base no tiene usuarios.
 * La contraseña se obtiene desde una variable local/entorno y nunca queda
 * incluida en el código ni en los scripts SQL del repositorio.
 */
@Component
@Order(1)
public class InitialAdminBootstrap implements CommandLineRunner {

    private static final Pattern EMAIL_PATTERN = Pattern.compile(
            "^[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}$",
            Pattern.CASE_INSENSITIVE);

    private final UsuarioRepository usuarioRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final String email;
    private final String password;

    public InitialAdminBootstrap(
            UsuarioRepository usuarioRepository,
            BCryptPasswordEncoder passwordEncoder,
            @Value("${app.initial-admin.email:admin@teamflow.com}") String email,
            @Value("${app.initial-admin.password:}") String password) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.email = email == null ? "" : email.trim().toLowerCase();
        this.password = password == null ? "" : password;
    }

    @Override
    public void run(String... args) {
        if (usuarioRepository.count() > 0) {
            return;
        }

        if (!EMAIL_PATTERN.matcher(email).matches()) {
            throw new IllegalStateException("INITIAL_ADMIN_EMAIL no contiene un correo válido");
        }
        if (!passwordSegura(password)) {
            throw new IllegalStateException(
                    "INITIAL_ADMIN_PASSWORD debe tener entre 8 y 64 caracteres, al menos una letra y un número");
        }

        Usuario admin = new Usuario();
        admin.setNombre("Administrador Principal");
        admin.setEmail(email);
        admin.setRol("admin");
        admin.setEstado("activo");
        admin.setPasswordHash(passwordEncoder.encode(password));
        usuarioRepository.save(admin);

        System.out.println("[SEGURIDAD] Administrador inicial creado desde la configuración local: " + email);
    }

    private boolean passwordSegura(String valor) {
        return valor != null
                && valor.length() >= 8
                && valor.length() <= 64
                && valor.matches(".*[A-Za-z].*")
                && valor.matches(".*\\d.*");
    }
}
