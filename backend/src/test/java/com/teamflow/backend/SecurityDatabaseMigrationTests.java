package com.teamflow.backend;

import com.teamflow.backend.migrations.SecurityDatabaseMigration;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SecurityDatabaseMigrationTests {
    @Mock JdbcTemplate jdbcTemplate;
    @InjectMocks SecurityDatabaseMigration migration;

    @Test void noHaceCambiosSiNoExisteColumnaAntigua() {
        when(jdbcTemplate.queryForObject(anyString(), eq(Integer.class))).thenReturn(0);
        assertDoesNotThrow(() -> migration.run());
        verify(jdbcTemplate, never()).execute(anyString());
    }

    @Test void noBorraClavesAntiguasSiFaltanHashes() {
        when(jdbcTemplate.queryForObject(anyString(), eq(Integer.class))).thenReturn(1, 2);
        assertThrows(IllegalStateException.class, () -> migration.run());
        verify(jdbcTemplate, never()).execute(anyString());
    }

    @Test void permiteLimpiarColumnaAntiguaCuandoTodosTienenBCrypt() {
        when(jdbcTemplate.queryForObject(anyString(), eq(Integer.class))).thenReturn(1, 0);
        assertDoesNotThrow(() -> migration.run());
        verify(jdbcTemplate).execute("ALTER TABLE usuarios DROP COLUMN password");
    }
}
