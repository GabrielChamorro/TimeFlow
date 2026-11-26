package com.teamflow.backend;
import com.teamflow.backend.controllers.PresenciaController;
import com.teamflow.backend.models.Usuario;
import com.teamflow.backend.repositories.UsuarioRepository;
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
class PresenciaV0522Tests {
    final JdbcTemplate jdbc=mock(JdbcTemplate.class);final UsuarioRepository usuarios=mock(UsuarioRepository.class);
    final PresenciaController controller=new PresenciaController(jdbc,usuarios);
    final UsernamePasswordAuthenticationToken auth=new UsernamePasswordAuthenticationToken("worker@local.test","unused");
    final Usuario user=new Usuario();
    @BeforeEach void setup(){user.setId(1L);user.setNombre("Trabajador");user.setRol("trabajador");user.setEstado("activo");when(usuarios.findByEmail(auth.getName())).thenReturn(Optional.of(user));}
    @Test void requiereIdentidadAutenticada(){assertEquals(401,controller.consultar(null).getStatusCode().value());verifyNoInteractions(jdbc);}
    @Test void identidadDesconocidaNoConsultaEquipo(){when(usuarios.findByEmail(auth.getName())).thenReturn(Optional.empty());assertEquals(401,controller.consultar(auth).getStatusCode().value());verifyNoInteractions(jdbc);}
    @Test void cuentaInactivaNoConsultaEquipo(){user.setEstado("inactivo");assertEquals(401,controller.consultar(auth).getStatusCode().value());verifyNoInteractions(jdbc);}
    @Test void unaConsultaUsaJornadaAbiertaYNoCuentaComoSustituto(){
        controller.consultar(auth);var sql=org.mockito.ArgumentCaptor.forClass(String.class);
        verify(jdbc).query(sql.capture(),org.mockito.ArgumentMatchers.<RowMapper<PresenciaController.Miembro>>any());
        assertTrue(sql.getValue().contains("j.usuario_id=u.id AND j.salida IS NULL"));
        assertFalse(sql.getValue().contains("password"));assertFalse(sql.getValue().contains("email"));
    }
    @Test void mockMvcPermiteTrabajadorPeroNoExponeCorreoClave() throws Exception {
        when(jdbc.query(anyString(),org.mockito.ArgumentMatchers.<RowMapper<PresenciaController.Miembro>>any()))
            .thenReturn(List.of(new PresenciaController.Miembro(1L,"Uno","trabajador",true),new PresenciaController.Miembro(2L,"Dos","trabajador",false)));
        MockMvcBuilders.standaloneSetup(controller).build().perform(get("/api/jornadas/presencia").principal(auth))
            .andExpect(status().isOk()).andExpect(header().string("Cache-Control","no-store"))
            .andExpect(jsonPath("$.serverNowMs").isNumber()).andExpect(jsonPath("$.pollIntervalMs").value(5000))
            .andExpect(jsonPath("$.members[0].presente").value(true)).andExpect(jsonPath("$.members[1].presente").value(false))
            .andExpect(jsonPath("$.members[0].email").doesNotExist()).andExpect(jsonPath("$.members[0].passwordHash").doesNotExist());
    }
}
