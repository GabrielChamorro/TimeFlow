package com.teamflow.backend;
import com.teamflow.backend.controllers.TareaController;
import com.teamflow.backend.models.*;
import com.teamflow.backend.repositories.*;
import com.teamflow.backend.services.JornadaService;
import org.junit.jupiter.api.*;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import java.util.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
class RechazosV0521Tests {
    final TareaRepository tareas=mock(TareaRepository.class);
    final UsuarioRepository usuarios=mock(UsuarioRepository.class);
    final RegistroTareaRepository registros=mock(RegistroTareaRepository.class);
    final TareaController controller=new TareaController(tareas,usuarios,mock(JornadaService.class),registros);
    final Usuario u=new Usuario(); final Tarea t=new Tarea();
    final UsernamePasswordAuthenticationToken auth=new UsernamePasswordAuthenticationToken("admin@local.test","unused");
    @BeforeEach void setup(){
        u.setId(1L);u.setNombre("Administrador");u.setRol("admin");
        t.setId(7L);t.setNombre("Tarea");t.setAsignadoUsuarioId(2L);t.setEstado("En Revisión");t.setVersion(3L);
        when(usuarios.findByEmail(auth.getName())).thenReturn(Optional.of(u));
        when(tareas.findByIdForUpdate(7L)).thenReturn(Optional.of(t));when(tareas.save(t)).thenReturn(t);
    }
    Tarea input(String motivo){var x=new Tarea();x.setNombre("Tarea");x.setVersion(3L);x.setEstado("En Progreso");x.setMotivoRechazo(motivo);return x;}
    @Test void motivoVacioNoCambiaEstadoNiEscribeHistorial(){
        for(String motivo:Arrays.asList(null," ","x".repeat(3001)))assertEquals(400,controller.actualizarTarea(7L,input(motivo),auth).getStatusCode().value());
        assertEquals("En Revisión",t.getEstado());verifyNoInteractions(registros);verify(tareas,never()).save(any());
    }
    @Test void rechazoConservaMotivoAutorYFecha(){
        assertEquals(200,controller.actualizarTarea(7L,input(" Falta evidencia "),auth).getStatusCode().value());
        assertEquals("En Progreso",t.getEstado());
        var captor=org.mockito.ArgumentCaptor.forClass(RegistroTarea.class);verify(registros).save(captor.capture());
        var r=captor.getValue();assertEquals("RECHAZO",r.tipo);assertEquals("Falta evidencia",r.contenido);assertEquals(1L,r.autorId);assertNotNull(r.creadoEnMs);
    }
    @Test void trabajadorNoPuedeRechazarNiSiEsResponsable(){
        u.setRol("trabajador");t.setAsignadoUsuarioId(1L);
        assertEquals(403,controller.actualizarTarea(7L,input("motivo"),auth).getStatusCode().value());verifyNoInteractions(registros);
    }
    @Test void rechazoObsoletoNoRegistraMotivo(){
        var x=input("motivo");x.setVersion(2L);assertEquals(409,controller.actualizarTarea(7L,x,auth).getStatusCode().value());verifyNoInteractions(registros);
    }
    @Test void aprobacionConservaTransicionSinExigirMotivo(){
        var x=input(null);x.setEstado("Finalizada");assertEquals(200,controller.actualizarTarea(7L,x,auth).getStatusCode().value());
        assertNotNull(t.getFinalizadaEnMs());verifyNoInteractions(registros);
    }
    @Test void mockMvcRechazaPeticionSinMotivo() throws Exception {
        MockMvcBuilders.standaloneSetup(controller).build().perform(put("/api/tareas/7").principal(auth).contentType("application/json")
            .content("{\"nombre\":\"Tarea\",\"version\":3,\"estado\":\"En Progreso\"}"))
            .andExpect(status().isBadRequest()).andExpect(jsonPath("$.message").value("Debes indicar un motivo de rechazo de entre 1 y 3000 caracteres"));
    }
}
