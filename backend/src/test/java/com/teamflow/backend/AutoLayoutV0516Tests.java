package com.teamflow.backend;

import com.teamflow.backend.controllers.TareaController;
import com.teamflow.backend.models.Tarea;
import com.teamflow.backend.models.Usuario;
import com.teamflow.backend.repositories.TareaRepository;
import com.teamflow.backend.repositories.UsuarioRepository;
import com.teamflow.backend.services.JornadaService;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AutoLayoutV0516Tests {
    private final TareaRepository tareas = mock(TareaRepository.class);
    private final UsuarioRepository usuarios = mock(UsuarioRepository.class);
    private final TareaController controller = new TareaController(tareas, usuarios, mock(JornadaService.class), mock(com.teamflow.backend.repositories.RegistroTareaRepository.class));
    private final Authentication auth = mock(Authentication.class);

    private void usuario(String rol) {
        Usuario user = new Usuario(); user.setRol(rol);
        when(auth.getName()).thenReturn("prueba@local.test");
        when(usuarios.findByEmail("prueba@local.test")).thenReturn(Optional.of(user));
    }

    @Test void soloAdministradorPuedeAutoorganizar() {
        usuario("trabajador");
        var resultado = controller.actualizarPosicionesMapa(List.of(
                new TareaController.PosicionPropuesta(1L, 10d, 20d, null, null)), auth);
        assertEquals(HttpStatus.FORBIDDEN, resultado.getStatusCode());
        verify(tareas, never()).saveAllAndFlush(any());
    }

    @Test void noGuardaSiHayIdDuplicado() {
        usuario("admin");
        var cambios = List.of(
                new TareaController.PosicionPropuesta(1L, 10d, 20d, null, null),
                new TareaController.PosicionPropuesta(1L, 15d, 30d, null, null));
        assertEquals(HttpStatus.BAD_REQUEST, controller.actualizarPosicionesMapa(cambios, auth).getStatusCode());
        verify(tareas, never()).saveAllAndFlush(any());
    }

    @Test void posicionesAntiguasEvitanSobrescribirOtrosCambios() {
        usuario("admin");
        Tarea tarea = new Tarea(); tarea.setId(1L); tarea.setPosicionX(25d); tarea.setPosicionY(40d);
        when(tareas.findByIdForUpdate(1L)).thenReturn(Optional.of(tarea));
        var result = controller.actualizarPosicionesMapa(List.of(
                new TareaController.PosicionPropuesta(1L, 30d, 50d, 20d, 40d)), auth);
        assertEquals(HttpStatus.CONFLICT, result.getStatusCode());
        verify(tareas, never()).saveAllAndFlush(any());
        assertEquals(25d, tarea.getPosicionX());
    }

    @Test void siFallaUnaTareaNoModificaNinguna() {
        usuario("admin");
        Tarea primera = new Tarea(); primera.setId(1L); primera.setPosicionX(10d); primera.setPosicionY(20d);
        when(tareas.findByIdForUpdate(1L)).thenReturn(Optional.of(primera));
        when(tareas.findByIdForUpdate(2L)).thenReturn(Optional.empty());
        var result = controller.actualizarPosicionesMapa(List.of(
                new TareaController.PosicionPropuesta(1L, 50d, 80d, 10d, 20d),
                new TareaController.PosicionPropuesta(2L, 60d, 90d, null, null)), auth);
        assertEquals(HttpStatus.CONFLICT, result.getStatusCode());
        assertEquals(10d, primera.getPosicionX());
        verify(tareas, never()).saveAllAndFlush(any());
    }

    @Test void rutaPorLoteUsaTransaccion() throws Exception {
        var method = TareaController.class.getMethod("actualizarPosicionesMapa", List.class, Authentication.class);
        assertNotNull(method.getAnnotation(Transactional.class));
    }
}
