package com.teamflow.backend;
import com.teamflow.backend.controllers.RegistroTareaController;
import com.teamflow.backend.models.*;
import com.teamflow.backend.repositories.*;
import org.junit.jupiter.api.*;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import java.util.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
class NotasV0521Tests {
    final TareaRepository tareas=mock(TareaRepository.class);
    final UsuarioRepository usuarios=mock(UsuarioRepository.class);
    final RegistroTareaRepository registros=mock(RegistroTareaRepository.class);
    final RegistroTareaController controller=new RegistroTareaController(tareas,usuarios,registros);
    final Usuario u=new Usuario();final Tarea t=new Tarea();
    final UsernamePasswordAuthenticationToken auth=new UsernamePasswordAuthenticationToken("own@local.test","unused");
    @BeforeEach void setup(){
        u.setId(1L);u.setNombre("Autor real");u.setRol("trabajador");
        t.setId(7L);t.setAsignadoUsuarioId(1L);t.setEstado("En Progreso");
        when(usuarios.findByEmail(auth.getName())).thenReturn(Optional.of(u));
        when(tareas.findByIdForUpdate(7L)).thenReturn(Optional.of(t));
        when(tareas.findById(7L)).thenReturn(Optional.of(t));
        when(registros.save(any())).thenAnswer(i->i.getArgument(0));
    }
    @Test void fechaYAutorSeAsignanEnServidor() {
        long before=System.currentTimeMillis();
        var response=controller.agregar(7L,new RegistroTareaController.NuevaNota("  Nota real  "),auth);
        assertEquals(201,response.getStatusCode().value());var r=(RegistroTarea)response.getBody();
        assertEquals(1L,r.autorId);assertEquals("Autor real",r.autorNombre);assertEquals("Nota real",r.contenido);
        assertTrue(r.creadoEnMs>=before&&r.creadoEnMs<=System.currentTimeMillis());
        verify(tareas).findByIdForUpdate(7L);verify(tareas,never()).save(any());
    }
    @Test void tareaAjenaNoPuedeLeerNiAgregar() {
        t.setAsignadoUsuarioId(2L);
        assertEquals(403,controller.agregar(7L,new RegistroTareaController.NuevaNota("privado"),auth).getStatusCode().value());
        assertEquals(403,controller.listar(7L,"NOTA",0,20,auth).getStatusCode().value());
        verifyNoInteractions(registros);
    }
    @Test void revisionYFinalizadaBloqueanNotas() {
        for(String estado:List.of("En Revisión","Finalizada")) {
            t.setEstado(estado);assertEquals(403,controller.agregar(7L,new RegistroTareaController.NuevaNota("nota"),auth).getStatusCode().value());
        }
        verifyNoInteractions(registros);
    }
    @Test void rechazaNotasVaciasYExcesivas() {
        for(String contenido:Arrays.asList(null,"  ","x".repeat(10001)))
            assertEquals(400,controller.agregar(7L,new RegistroTareaController.NuevaNota(contenido),auth).getStatusCode().value());
        verifyNoInteractions(registros);
    }
    @Test void limitaPaginacionYTipoAntesDeConsultar() {
        assertEquals(400,controller.listar(7L,"NOTA",-1,20,auth).getStatusCode().value());
        assertEquals(400,controller.listar(7L,"NOTA",0,101,auth).getStatusCode().value());
        assertEquals(400,controller.listar(7L,"OTRO",0,20,auth).getStatusCode().value());
        verifyNoInteractions(registros);
    }
    @Test void legadoNoInventaFechaNiAutor() {
        t.setBitacora("texto antiguo");var r=RegistroTarea.legado(t);
        assertNull(r.creadoEnMs);assertNull(r.autorId);assertEquals("texto antiguo",r.contenido);
    }
    @Test void mockMvcValidaCuerpoYSerializaAutorFecha() throws Exception {
        var mvc=MockMvcBuilders.standaloneSetup(controller).build();
        mvc.perform(post("/api/tareas/7/registros").principal(auth).contentType("application/json").content("{\"contenido\":\"Nota HTTP\"}"))
            .andExpect(status().isCreated()).andExpect(jsonPath("$.autorNombre").value("Autor real")).andExpect(jsonPath("$.creadoEnMs").isNumber());
        mvc.perform(post("/api/tareas/7/registros").principal(auth).contentType("application/json").content("{}"))
            .andExpect(status().isBadRequest());
    }
}
