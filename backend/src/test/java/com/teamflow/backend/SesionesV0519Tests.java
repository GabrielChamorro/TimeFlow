package com.teamflow.backend;

import com.teamflow.backend.config.JwtService;
import com.teamflow.backend.controllers.UsuarioController;
import com.teamflow.backend.models.Usuario;
import com.teamflow.backend.repositories.UsuarioRepository;
import com.teamflow.backend.security.SessionRegistry;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class SesionesV0519Tests {
    private final SessionRegistry sessions = mock(SessionRegistry.class);
    private final JwtService jwt = new JwtService("TimeFlow_Solo_Pruebas_Sesiones_19_123456789", 60000, sessions);
    private Usuario user() {
        Usuario u = new Usuario(); u.setId(19L); u.setEmail("sesion@local.test");
        u.setNombre("Sesión"); u.setEstado("activo"); u.setRol("trabajador");
        u.setPasswordHash("$2a$12$hashPrueba"); return u;
    }
    @Test void logoutRevocaSoloElIdentificadorFirmadoDeEsaSesion() {
        Set<String> active = new HashSet<>();
        doAnswer(i -> { active.add(i.getArgument(0)); return null; }).when(sessions).register(anyString(), anyLong(), anyLong());
        when(sessions.isActive(anyString(), anyLong())).thenAnswer(i -> active.contains(i.getArgument(0)));
        doAnswer(i -> { active.remove(i.getArgument(0)); return null; }).when(sessions).revoke(anyString());
        Usuario u = user(); String a = jwt.generateToken(u), b = jwt.generateToken(u);
        assertNotEquals(a,b); assertTrue(jwt.isTokenValid(a,u));
        jwt.revokeToken(a);
        assertFalse(jwt.isTokenValid(a,u)); assertTrue(jwt.isTokenValid(b,u));
        verify(sessions, never()).revokeAll(anyLong());
    }
    @Test void jwtFirmadoPeroNoRegistradoSeRechaza() {
        Usuario u = user(); String token = jwt.generateToken(u);
        when(sessions.isActive(anyString(), anyLong())).thenReturn(false);
        assertFalse(jwt.isTokenValid(token,u));
    }
    @Test void falloDeRegistroNoEntregaToken() {
        doThrow(new org.springframework.dao.DataAccessResourceFailureException("offline"))
                .when(sessions).register(anyString(),anyLong(),anyLong());
        assertThrows(org.springframework.dao.DataAccessException.class, () -> jwt.generateToken(user()));
    }
    @Test void registroNoAlmacenaTokenNiJtiEnClaro() {
        JdbcTemplate jdbc = mock(JdbcTemplate.class);
        new SessionRegistry(jdbc).register("identificador-secreto-de-prueba",19L,123456L);
        var sql = org.mockito.ArgumentCaptor.forClass(String.class);
        var digest = org.mockito.ArgumentCaptor.forClass(Object.class);
        verify(jdbc).update(sql.capture(),digest.capture(),eq(19L),eq(123456L));
        assertTrue(sql.getValue().startsWith("INSERT INTO sesiones_jwt"));
        assertTrue(digest.getValue().toString().matches("[0-9a-f]{64}"));
        assertNotEquals("identificador-secreto-de-prueba",digest.getValue());
    }
    @Test void desactivarYReactivarRevocanSinRecuperarSesiones() {
        UsuarioRepository repo = mock(UsuarioRepository.class); Usuario u = user();
        when(repo.findByIdForUpdate(19L)).thenReturn(Optional.of(u)); when(repo.save(u)).thenReturn(u);
        var c = new UsuarioController(repo,mock(BCryptPasswordEncoder.class),sessions);
        assertEquals(204,c.eliminarUsuario(19L,null,null).getStatusCode().value());
        assertEquals("inactivo",u.getEstado());
        assertEquals(200,c.reactivarUsuario(19L).getStatusCode().value());
        verify(sessions,times(2)).revokeAll(19L);
        verify(repo,never()).findById(anyLong());
    }
    @Test void cambiarPasswordRevocaTodasLasSesionesAntesDeGuardar() {
        UsuarioRepository repo = mock(UsuarioRepository.class); Usuario u = user(), datos = user();
        datos.setPassword("NuevaClave19"); var encoder = mock(BCryptPasswordEncoder.class);
        when(repo.findByIdForUpdate(19L)).thenReturn(Optional.of(u));
        when(repo.findByEmail(u.getEmail())).thenReturn(Optional.of(u));
        when(encoder.encode("NuevaClave19")).thenReturn("$2a$12$nuevo");
        var c = new UsuarioController(repo,encoder,sessions);
        assertEquals(200,c.actualizarUsuario(19L,datos,null).getStatusCode().value());
        var order = inOrder(sessions,repo); order.verify(sessions).revokeAll(19L); order.verify(repo).save(u);
        assertEquals("$2a$12$nuevo",u.getPasswordHash());
    }
}
