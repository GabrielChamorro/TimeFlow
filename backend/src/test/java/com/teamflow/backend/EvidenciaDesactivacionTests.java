package com.teamflow.backend;

import com.teamflow.backend.controllers.EvidenciaTareaController;
import com.teamflow.backend.models.EvidenciaTarea;
import com.teamflow.backend.models.Tarea;
import com.teamflow.backend.models.Usuario;
import com.teamflow.backend.repositories.EvidenciaTareaRepository;
import com.teamflow.backend.repositories.TareaRepository;
import com.teamflow.backend.repositories.UsuarioRepository;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.Authentication;
import org.springframework.http.HttpStatus;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class EvidenciaDesactivacionTests {
    @Test
    void archivoDesactivadoSeGuardaSinBorrarlo() {
        EvidenciaTareaRepository evidencias = mock(EvidenciaTareaRepository.class);
        TareaRepository tareas = mock(TareaRepository.class);
        UsuarioRepository usuarios = mock(UsuarioRepository.class);
        Authentication auth = mock(Authentication.class);
        when(auth.getName()).thenReturn("admin@test.local");
        Usuario admin = new Usuario();
        admin.setId(5L); admin.setNombre("Admin"); admin.setRol("admin");
        when(usuarios.findByEmail("admin@test.local")).thenReturn(Optional.of(admin));
        Tarea tarea = new Tarea(); tarea.setId(2L); tarea.setEstado("En Progreso");
        when(tareas.findByIdForUpdate(2L)).thenReturn(Optional.of(tarea));
        EvidenciaTarea archivo = new EvidenciaTarea();
        archivo.setTareaId(2L);
        when(evidencias.findById(8L)).thenReturn(Optional.of(archivo));
        var controller = new EvidenciaTareaController(evidencias,tareas,usuarios);
        var respuesta = controller.eliminar(2L,8L,auth,null);
        assertEquals(HttpStatus.NO_CONTENT,respuesta.getStatusCode());
        assertFalse(archivo.isActivo());
        verify(evidencias).save(archivo);
        verify(evidencias,never()).delete(any(EvidenciaTarea.class));
    }

    @Test
    void archivoDesactivadoNoSePuedeDescargar() {
        EvidenciaTareaRepository evidencias = mock(EvidenciaTareaRepository.class);
        TareaRepository tareas = mock(TareaRepository.class);
        UsuarioRepository usuarios = mock(UsuarioRepository.class);
        Authentication auth = mock(Authentication.class);
        when(auth.getName()).thenReturn("admin@test.local");
        when(usuarios.findByEmail("admin@test.local")).thenReturn(Optional.of(new Usuario()));
        EvidenciaTarea archivo = new EvidenciaTarea();
        archivo.setTareaId(2L); archivo.setActivo(false);
        when(evidencias.findById(8L)).thenReturn(Optional.of(archivo));
        var controller = new EvidenciaTareaController(evidencias,tareas,usuarios);
        assertEquals(HttpStatus.NOT_FOUND,controller.descargar(2L,8L,auth).getStatusCode());
    }
}
