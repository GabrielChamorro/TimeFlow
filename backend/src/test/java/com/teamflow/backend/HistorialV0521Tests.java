package com.teamflow.backend;
import com.teamflow.backend.controllers.*;
import com.teamflow.backend.models.*;
import com.teamflow.backend.repositories.*;
import com.teamflow.backend.services.*;
import org.junit.jupiter.api.*;
import org.springframework.jdbc.core.*;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import java.util.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
class HistorialV0521Tests {
    final UsuarioRepository usuarios=mock(UsuarioRepository.class);
    final HistorialTareaService historial=mock(HistorialTareaService.class);
    final HistorialTareaController controller=new HistorialTareaController(usuarios,historial);
    final Usuario u=new Usuario();
    final UsernamePasswordAuthenticationToken auth=new UsernamePasswordAuthenticationToken("worker@local.test","unused");
    @BeforeEach void setup(){u.setId(3L);u.setNombre("Responsable");u.setRol("trabajador");when(usuarios.findByEmail(auth.getName())).thenReturn(Optional.of(u));}
    @Test void validacionRechazaFechasYPaginacionSinConsultarBase(){
        assertEquals(400,controller.listar(-1,20,"",null,null,auth).getStatusCode().value());
        assertEquals(400,controller.listar(0,101,"",null,null,auth).getStatusCode().value());
        assertEquals(400,controller.listar(0,20,"","2026-02-30",null,auth).getStatusCode().value());
        assertEquals(400,controller.listar(0,20,"","2026-11-15","2026-11-14",auth).getStatusCode().value());
        assertEquals(400,controller.listar(0,20,"x".repeat(181),null,null,auth).getStatusCode().value());verifyNoInteractions(historial);
    }
    @Test void noHayHistorialSinAutenticar(){assertEquals(401,controller.listar(0,20,"",null,null,null).getStatusCode().value());verifyNoInteractions(historial);}
    @Test void rangoIncluyeDiaHastaCompletoEnUtc(){
        controller.listar(0,10," consulta ","2026-11-15","2026-11-15",auth);
        verify(historial).buscar(u,0,10,"consulta",1794700800000L,1794787200000L);
    }
    @Test void mockMvcEntregaSoloPaginaSolicitada() throws Exception {
        when(historial.buscar(u,1,10,"",null,null)).thenReturn(Map.of("content",List.of(),"page",1,"totalElements",11));
        MockMvcBuilders.standaloneSetup(controller).build().perform(get("/api/tareas/historial?page=1&size=10").principal(auth))
            .andExpect(status().isOk()).andExpect(jsonPath("$.page").value(1)).andExpect(jsonPath("$.totalElements").value(11));
    }
    @SuppressWarnings("unchecked") // Cast del RowMapper genérico de Mockito; no suprime controles del producto.
    @Test void sqlLimitaFilasYColumnasYAplicaResponsableAntesDePaginar(){
        var jdbc=mock(JdbcTemplate.class);when(jdbc.queryForObject(anyString(),eq(Long.class),any(Object[].class))).thenReturn(11L);
        when(jdbc.query(anyString(),any(RowMapper.class),any(Object[].class))).thenReturn(List.of());
        var response=new HistorialTareaService(jdbc).buscar(u,1,10,"%' OR 1=1 --",null,null);
        assertEquals(11L,response.get("totalElements"));
        var sql=org.mockito.ArgumentCaptor.forClass(String.class);var values=org.mockito.ArgumentCaptor.forClass(Object[].class);
        verify(jdbc).query(sql.capture(),any(RowMapper.class),values.capture());
        assertTrue(sql.getValue().contains("asignado_usuario_id=?"));assertTrue(sql.getValue().endsWith("LIMIT ? OFFSET ?"));
        assertFalse(sql.getValue().contains("evidencia"));assertFalse(sql.getValue().contains("bitacora"));assertFalse(sql.getValue().contains("OR 1=1"));
        assertEquals(10,values.getValue()[values.getValue().length-2]);assertEquals(10L,values.getValue()[values.getValue().length-1]);
    }
    @Test void detalleAjenoNoSeExponeAunqueEsteFinalizado(){
        var tareas=mock(TareaRepository.class);var c=new TareaController(tareas,usuarios,mock(JornadaService.class),mock(RegistroTareaRepository.class));
        var t=new Tarea();t.setId(7L);t.setAsignadoUsuarioId(4L);t.setEstado("Finalizada");when(tareas.findById(7L)).thenReturn(Optional.of(t));
        assertEquals(403,c.detalleTarea(7L,auth).getStatusCode().value());
        t.setAsignadoUsuarioId(3L);assertEquals(200,c.detalleTarea(7L,auth).getStatusCode().value());
    }
}
