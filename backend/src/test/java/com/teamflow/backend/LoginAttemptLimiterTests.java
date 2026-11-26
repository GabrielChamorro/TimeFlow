package com.teamflow.backend;

import com.teamflow.backend.security.LoginAttemptLimiter;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class LoginAttemptLimiterTests {
    @Test void bloqueaTrasOchoFallosSinAfectarOtrosUsuarios() {
        LoginAttemptLimiter limitador = new LoginAttemptLimiter();
        for (int intento=0; intento<8; intento++) {
            assertFalse(limitador.bloqueado("ana@example.test", "127.0.0.1"));
            limitador.registrarFallo("ana@example.test", "127.0.0.1");
        }
        assertTrue(limitador.bloqueado("ana@example.test", "127.0.0.1"));
        assertFalse(limitador.bloqueado("otro@example.test", "127.0.0.1"));
        limitador.registrarExito("ana@example.test", "127.0.0.1");
        assertFalse(limitador.bloqueado("ana@example.test", "127.0.0.1"));
    }
}
