package com.teamflow.backend;
import com.teamflow.backend.controllers.TareaController;
import com.teamflow.backend.models.*;
import com.teamflow.backend.repositories.*;
import com.teamflow.backend.services.JornadaService;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.Authentication;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class EdicionTareasV0519Tests {
    private final TareaRepository repo = mock(TareaRepository.class);
    private final UsuarioRepository users = mock(UsuarioRepository.class);
    private final Authentication auth = mock(Authentication.class);
    private final TareaController c = new TareaController(repo,users,mock(JornadaService.class),mock(com.teamflow.backend.repositories.RegistroTareaRepository.class));
    private Tarea setup() {
        Usuario u = new Usuario();u.setId(1L);u.setEmail("admin@local.test");u.setRol("admin");
        when(auth.getName()).thenReturn(u.getEmail());when(users.findByEmail(u.getEmail())).thenReturn(Optional.of(u));
        Tarea t = new Tarea();t.setId(1L);t.setNombre("Actual");t.setVersion(3L);t.setBitacora("Cambio remoto");
        when(repo.findByIdForUpdate(1L)).thenReturn(Optional.of(t));return t;
    }
    @Test void versionAnteriorDevuelve409SinModificarLaFila() {
        Tarea t=setup(), input=new Tarea();input.setNombre("Cambio local");input.setVersion(2L);
        assertEquals(409,c.actualizarTarea(1L,input,auth).getStatusCode().value());
        assertEquals("Cambio remoto",t.getBitacora());verify(repo,never()).save(any());
    }
    @Test void versionOmitidaDevuelve400() {
        setup();Tarea input=new Tarea();input.setNombre("Sin versión");
        assertEquals(400,c.actualizarTarea(1L,input,auth).getStatusCode().value());verify(repo,never()).save(any());
    }
    @Test void versionActualConservaPosicionYDependenciasMultiples() {
        Tarea t=setup();t.setPosicionX(555d);t.setDependenciaIds(List.of(8L,9L));
        Tarea input=new Tarea();input.setVersion(3L);input.setNombre("Edición");input.setDependenciaIds(List.of(9L,8L));
        when(repo.save(t)).thenReturn(t);
        assertEquals(200,c.actualizarTarea(1L,input,auth).getStatusCode().value());
        assertEquals(555d,t.getPosicionX());assertEquals(List.of(9L,8L),t.getDependenciaIds());
    }
    @Test void permisoSeCompruebaAntesDeRevelarConflictos() {
        Tarea t=setup();Usuario worker=new Usuario();worker.setId(2L);worker.setRol("trabajador");
        when(users.findByEmail("admin@local.test")).thenReturn(Optional.of(worker));t.setAsignadoUsuarioId(1L);
        Tarea input=new Tarea();input.setVersion(0L);
        assertEquals(403,c.actualizarTarea(1L,input,auth).getStatusCode().value());verify(repo,never()).save(any());
    }
}
