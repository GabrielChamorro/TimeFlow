package com.teamflow.backend.migrations;

import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * Limpieza puntual para bases creadas por versiones antiguas de TimeFlow.
 * V0.1-V0.3 podían dejar una columna "password" en texto plano en usuarios.
 * La aplicación actual solo utiliza password_hash (BCrypt), por lo que esa columna
 * heredada se elimina automáticamente al iniciar V0.4.0.
 */
@Component
@Order(0)
public class SecurityDatabaseMigration implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    public SecurityDatabaseMigration(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) {
        Integer existe = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*)
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = 'usuarios'
                  AND COLUMN_NAME = 'password'
                """,
                Integer.class);

        if (existe != null && existe > 0) {
            // No destruir las credenciales antiguas si faltan hashes BCrypt válidos.
            // El respaldo lo crea el instalador; los usuarios legados necesitan migración explícita.
            Integer sinHash = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM usuarios WHERE password_hash IS NULL OR password_hash NOT LIKE '$2%'",
                    Integer.class);
            if (sinHash != null && sinHash > 0) {
                throw new IllegalStateException(
                        "Hay usuarios antiguos sin password_hash BCrypt. " +
                        "No se eliminó usuarios.password. Revisa la migración y el respaldo antes de continuar.");
            }
            jdbcTemplate.execute("ALTER TABLE usuarios DROP COLUMN password");
            System.out.println("[SEGURIDAD] Columna heredada usuarios.password eliminada; se conserva solo password_hash.");
        }
    }
}
