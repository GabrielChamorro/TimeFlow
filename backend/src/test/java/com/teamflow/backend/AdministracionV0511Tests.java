package com.teamflow.backend;

import com.teamflow.backend.controllers.UsuarioController;
import com.teamflow.backend.controllers.TipoTareaController;
import com.teamflow.backend.models.Usuario;
import com.teamflow.backend.models.TipoTarea;
import com.teamflow.backend.repositories.UsuarioRepository;
import com.teamflow.backend.repositories.TipoTareaRepository;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AdministracionV0511Tests {
    private Authentication auth(String role) {
        Authentication authentication = mock(Authentication.class);
        when(authentication.getAuthorities()).thenAnswer(i -> List.of(new SimpleGrantedAuthority("ROLE_" + role)));
        return authentication;
    }

    @Test void soloAdministradorListaCuentasInactivas() {
        UsuarioRepository repository = mock(UsuarioRepository.class);
        Usuario user = new Usuario(); user.setId(1L); user.setEstado("inactivo");
        when(repository.findAll()).thenReturn(List.of(user));
        UsuarioController controller = new UsuarioController(repository, mock(BCryptPasswordEncoder.class), mock(com.teamflow.backend.security.SessionRegistry.class));
        assertEquals(403, controller.listarAdministracion(auth("TRABAJADOR")).getStatusCode().value());
        verify(repository, never()).findAll();
        var result = controller.listarAdministracion(auth("ADMIN"));
        assertEquals(200, result.getStatusCode().value());
        assertEquals(1, ((List<?>) result.getBody()).size());
    }

    @Test void soloAdministradorListaPlantillasInactivas() {
        TipoTareaRepository repository = mock(TipoTareaRepository.class);
        TipoTarea inactive = new TipoTarea("Antigua", "Guardada"); inactive.setActivo(false);
        when(repository.findAll()).thenReturn(List.of(inactive));
        TipoTareaController controller = new TipoTareaController(repository);
        assertEquals(403, controller.listarAdministracion(auth("TRABAJADOR")).getStatusCode().value());
        verify(repository, never()).findAll();
        var result = controller.listarAdministracion(auth("ADMIN"));
        assertEquals(200, result.getStatusCode().value());
        assertEquals(1, ((List<?>) result.getBody()).size());
    }

    @Test void erroresDeUnicidadDevuelvenConflictoYNoDatosDeBD() {
        UsuarioController users = new UsuarioController(mock(UsuarioRepository.class), mock(BCryptPasswordEncoder.class), mock(com.teamflow.backend.security.SessionRegistry.class));
        TipoTareaController types = new TipoTareaController(mock(TipoTareaRepository.class));
        assertEquals(409, users.conflictoDeDatos().getStatusCode().value());
        assertEquals(409, types.conflictoDeDatos().getStatusCode().value());
    }
}
