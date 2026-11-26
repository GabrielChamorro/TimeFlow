package com.teamflow.backend;

import com.teamflow.backend.controllers.TareaController;
import com.teamflow.backend.models.Usuario;
import com.teamflow.backend.repositories.TareaRepository;
import com.teamflow.backend.repositories.UsuarioRepository;
import com.teamflow.backend.services.JornadaService;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

class AutoLayoutPreflightV0517Tests {
    private final TareaRepository tareas = mock(TareaRepository.class);
    private final UsuarioRepository usuarios = mock(UsuarioRepository.class);
    private final Authentication auth = mock(Authentication.class);
    private final TareaController controller = new TareaController(tareas, usuarios, mock(JornadaService.class), mock(com.teamflow.backend.repositories.RegistroTareaRepository.class));

    private void admin() {
        Usuario usuario = new Usuario();
        usuario.setRol("admin");
        when(auth.getName()).thenReturn("admin@local.test");
        when(usuarios.findByEmail("admin@local.test")).thenReturn(Optional.of(usuario));
    }

    @Test void rechazaMovimientoManualFueraDeRango() {
        admin();
        var resultado = controller.actualizarPosicionMapa(1L,
                Map.of("posicionX", 10_000_001.0, "posicionY", 20.0), auth);
        assertEquals(HttpStatus.BAD_REQUEST, resultado.getStatusCode());
        verify(tareas, never()).findByIdForUpdate(anyLong());
    }

    @Test void rechazaMovimientoManualSinCoordenadas() {
        admin();
        var resultado = controller.actualizarPosicionMapa(1L,
                Map.of("posicionX", 10.0), auth);
        assertEquals(HttpStatus.BAD_REQUEST, resultado.getStatusCode());
        verify(tareas, never()).findByIdForUpdate(anyLong());
    }
}
