package com.teamflow.backend;

import com.teamflow.backend.models.Jornada;
import com.teamflow.backend.models.Usuario;
import com.teamflow.backend.repositories.JornadaRepository;
import com.teamflow.backend.repositories.UsuarioRepository;
import com.teamflow.backend.services.JornadaService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JornadaServiceTests {
    @Mock JornadaRepository jornadas;
    @Mock UsuarioRepository usuarios;
    @InjectMocks JornadaService servicio;

    @Test void unCheckInGuardaUsuarioYHoraDelServidor() {
        Usuario u = new Usuario();
        u.setId(1L);
        when(usuarios.findByIdForUpdate(1L)).thenReturn(Optional.of(u));
        when(jornadas.saveAndFlush(any(Jornada.class))).thenAnswer(i -> {
            Jornada j = i.getArgument(0);
            j.setId(4L);
            return j;
        });
        var respuesta = servicio.registrarEntrada(1L).orElseThrow();
        assertEquals(4L, respuesta.id());
        assertTrue(respuesta.activa());
        assertTrue(respuesta.checkInAt().endsWith("Z"));
        verify(jornadas).saveAndFlush(argThat(j -> j.getUsuario().getId() == 1L
                && j.getUsuarioActivoId() == 1L && j.getSalida() == null));
    }

    @Test void segundoCheckInNoCreaOtraJornada() {
        Usuario u = new Usuario(); u.setId(1L);
        when(usuarios.findByIdForUpdate(1L)).thenReturn(Optional.of(u));
        when(jornadas.existsByUsuarioIdAndSalidaIsNull(1L)).thenReturn(true);
        assertTrue(servicio.registrarEntrada(1L).isEmpty());
        verify(jornadas, never()).saveAndFlush(any(Jornada.class));
    }

    @Test void checkOutCierraLaJornadaYLiberaIndiceUnico() {
        Usuario u = new Usuario(); u.setId(1L);
        Jornada j = new Jornada();
        j.setId(4L);
        j.setUsuario(u);
        j.setUsuarioActivoId(1L);
        j.setEntrada(java.time.LocalDateTime.now(java.time.ZoneOffset.UTC).minusMinutes(2));
        when(usuarios.findByIdForUpdate(1L)).thenReturn(Optional.of(u));
        when(jornadas.findFirstByUsuarioIdAndSalidaIsNullOrderByEntradaDesc(1L)).thenReturn(Optional.of(j));
        when(jornadas.saveAndFlush(any(Jornada.class))).thenAnswer(i -> i.getArgument(0));
        var respuesta = servicio.registrarSalida(1L).orElseThrow();
        assertFalse(respuesta.activa());
        assertNotNull(respuesta.checkOutAt());
        assertNull(j.getUsuarioActivoId());
        assertTrue(respuesta.duracionSegundos() >= 60);
    }

    @Test void sinUsuarioBloqueadoNoSePermiteCrearTarea() {
        when(usuarios.findByIdForUpdate(2L)).thenReturn(Optional.empty());
        assertFalse(servicio.tieneJornadaActiva(2L));
        verify(jornadas, never()).existsByUsuarioIdAndSalidaIsNull(any());
    }
}
