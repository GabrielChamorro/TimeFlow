package com.teamflow.backend;
import com.teamflow.backend.controllers.UsuarioController;
import com.teamflow.backend.models.Usuario;
import com.teamflow.backend.repositories.UsuarioRepository;
import com.teamflow.backend.security.SessionRegistry;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
class EdicionUsuariosV0519Tests {
    private final UsuarioRepository repo=mock(UsuarioRepository.class);
    private final SessionRegistry sessions=mock(SessionRegistry.class);
    private final UsuarioController c=new UsuarioController(repo,mock(BCryptPasswordEncoder.class),sessions);
    private Usuario user(long version) {
        Usuario u=new Usuario();u.setId(19L);u.setNombre("Actual");u.setEmail("user@local.test");u.setRol("trabajador");u.setEstado("activo");u.setVersion(version);return u;
    }
    @Test void edicionObsoletaNoSobrescribeNiRevoca() {
        Usuario current=user(2),input=user(1);when(repo.findByIdForUpdate(19L)).thenReturn(Optional.of(current));
        assertEquals(409,c.actualizarUsuario(19L,input,null).getStatusCode().value());
        verify(repo,never()).save(any());verifyNoInteractions(sessions);
    }
    @Test void bajaDuranteEdicionDevuelve409() {
        Usuario current=user(2);current.setEstado("inactivo");when(repo.findByIdForUpdate(19L)).thenReturn(Optional.of(current));
        assertEquals(409,c.actualizarUsuario(19L,user(1),null).getStatusCode().value());verify(repo,never()).save(any());
    }
    @Test void versionActualPermiteNombreSinRevocarSesiones() {
        Usuario current=user(2),input=user(2);input.setNombre("Nuevo nombre");when(repo.findByIdForUpdate(19L)).thenReturn(Optional.of(current));
        assertEquals(200,c.actualizarUsuario(19L,input,null).getStatusCode().value());
        assertEquals("Nuevo nombre",current.getNombre());verifyNoInteractions(sessions);
    }
    @Test void cambioDeRolRevocaSesionesDeLaCuenta() {
        Usuario current=user(2),input=user(2);input.setRol("admin");when(repo.findByIdForUpdate(19L)).thenReturn(Optional.of(current));
        assertEquals(200,c.actualizarUsuario(19L,input,null).getStatusCode().value());verify(sessions).revokeAll(19L);
    }
}
