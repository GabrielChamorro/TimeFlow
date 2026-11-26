package com.teamflow.backend;
import com.teamflow.backend.controllers.TareaController;
import com.teamflow.backend.models.*;
import com.teamflow.backend.repositories.*;
import com.teamflow.backend.services.JornadaService;
import org.junit.jupiter.api.*;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import java.util.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;
import static org.junit.jupiter.api.Assertions.*;
class CreacionV0521Tests {
    final TareaRepository tareas=mock(TareaRepository.class);final UsuarioRepository usuarios=mock(UsuarioRepository.class);
    final JornadaService jornadas=mock(JornadaService.class);
    final TareaController controller=new TareaController(tareas,usuarios,jornadas,mock(RegistroTareaRepository.class));
    final UsernamePasswordAuthenticationToken auth=new UsernamePasswordAuthenticationToken("worker@local.test","unused");
    @BeforeEach void setup(){var u=new Usuario();u.setId(1L);u.setNombre("Trabajador");u.setRol("trabajador");when(usuarios.findByEmail(auth.getName())).thenReturn(Optional.of(u));when(jornadas.tieneJornadaActiva(1L)).thenReturn(true);when(tareas.save(any())).thenAnswer(i->i.getArgument(0));}
    Tarea valid(){var t=new Tarea();t.setNombre("Tarea válida");t.setMeta("Resultado verificable");t.setFechaLimite("2030-12-01T18:00");return t;}
    @Test void nombreMetaYHoraSonObligatoriosSinValoresSustitutos(){
        var name=valid();name.setNombre(" ");var meta=valid();meta.setMeta(" ");var deadline=valid();deadline.setFechaLimite(null);
        for(var t:List.of(name,meta,deadline))assertEquals(400,controller.crearTarea(t,auth).getStatusCode().value());verify(tareas,never()).save(any());
    }
    @Test void creacionValidaIniciaEnProgresoSinPermitirCierreFalsificado(){
        var t=valid();t.setEstado("Finalizada");t.setFinalizadaEnMs(1L);
        assertEquals(201,controller.crearTarea(t,auth).getStatusCode().value());assertEquals("En Progreso",t.getEstado());assertNull(t.getFinalizadaEnMs());
    }
}
