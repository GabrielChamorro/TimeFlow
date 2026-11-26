package com.teamflow.backend;

import com.teamflow.backend.config.JwtService;
import com.teamflow.backend.models.Usuario;
import com.teamflow.backend.repositories.UsuarioRepository;
import com.teamflow.backend.controllers.UsuarioController;
import com.teamflow.backend.security.LoginAttemptLimiter;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import java.util.Optional;

class SecurityAuditV0510Tests {
    private com.teamflow.backend.security.SessionRegistry activeSessions() {
        var sessions = mock(com.teamflow.backend.security.SessionRegistry.class);
        when(sessions.isActive(anyString(), anyLong())).thenReturn(true);
        return sessions;
    }

    private Usuario usuario() {
        Usuario u = new Usuario();
        u.setId(7L);u.setNombre("Ana");u.setRol("admin");
        u.setEmail("ana@example.test");u.setEstado("activo");
        u.setPasswordHash("$2a$12$valorHashInicial");
        return u;
    }

    @Test void cambioDeContrasenaInvalidaTokenAnterior() {
        JwtService service = new JwtService("TimeFlow_Clave_Auditoria_2026_32_Bytes_Minimo", 3600000L, activeSessions());
        Usuario u = usuario();
        String antiguo = service.generateToken(u);
        assertTrue(service.isTokenValid(antiguo, u));
        u.setPasswordHash("$2a$12$valorHashNuevo");
        assertFalse(service.isTokenValid(antiguo, u));
        String nuevo = service.generateToken(u);
        assertTrue(service.isTokenValid(nuevo, u));
    }

    @Test void administradorNoPuedeDesactivarSuPropiaCuentaPorPut() {
        UsuarioRepository repo = mock(UsuarioRepository.class);
        Authentication auth = mock(Authentication.class);
        Usuario actual = usuario();
        Usuario datos = usuario();
        datos.setEstado("inactivo");
        when(auth.getName()).thenReturn("ana@example.test");
        when(repo.findByIdForUpdate(7L)).thenReturn(Optional.of(actual));
        when(repo.findByEmail("ana@example.test")).thenReturn(Optional.of(actual));
        UsuarioController ctrl = new UsuarioController(repo, mock(BCryptPasswordEncoder.class), mock(com.teamflow.backend.security.SessionRegistry.class));
        assertEquals(409, ctrl.actualizarUsuario(7L, datos, auth).getStatusCode().value());
        verify(repo, never()).save(any());
    }
    @Test void directorioTrabajadoresNoExponeCorreoAjeno() {
        UsuarioRepository repo = mock(UsuarioRepository.class);
        Authentication auth = mock(Authentication.class);
        when(auth.getAuthorities()).thenAnswer(invocation -> java.util.List.of(
                new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_TRABAJADOR")));
        when(repo.findVisibles()).thenReturn(java.util.List.of(usuario()));
        UsuarioController ctrl = new UsuarioController(repo, mock(BCryptPasswordEncoder.class), mock(com.teamflow.backend.security.SessionRegistry.class));
        var response = ctrl.listarUsuarios(auth);
        assertEquals(200, response.getStatusCode().value());
        var result = (java.util.List<?>) response.getBody();
        assertNotNull(result);
        assertInstanceOf(com.teamflow.backend.dto.UsuarioDirectorio.class, result.get(0));
    }

}
