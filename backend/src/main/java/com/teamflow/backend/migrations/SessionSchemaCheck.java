package com.teamflow.backend.migrations;

import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/** Fallar al iniciar si no se aplicó la migración; nunca habilitar JWT sin registro. */
@Component
@Order(1)
public class SessionSchemaCheck implements CommandLineRunner {
    private final JdbcTemplate jdbc;
    public SessionSchemaCheck(JdbcTemplate jdbc) { this.jdbc = jdbc; }
    @Override public void run(String... args) {
        try {
            jdbc.queryForList("SELECT session_hash, usuario_id, expires_at_ms FROM sesiones_jwt LIMIT 0");
            jdbc.queryForList("SELECT version FROM tareas LIMIT 0");
            jdbc.queryForList("SELECT version FROM usuarios LIMIT 0");
            jdbc.queryForList("SELECT version FROM tipos_tarea LIMIT 0");
            jdbc.queryForList("SELECT token_hash,session_hash,used_at_ms FROM renovaciones_jwt LIMIT 0");
        } catch (org.springframework.dao.DataAccessException ex) {
            throw new IllegalStateException("Aplica las migraciones V0.5.19 de sesiones y tareas antes de iniciar TimeFlow.", ex);
        }
    }
}
