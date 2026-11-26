package com.teamflow.backend;
import com.teamflow.backend.controllers.*;
import com.teamflow.backend.models.*;
import com.teamflow.backend.repositories.*;
import com.teamflow.backend.security.SessionRegistry;
import com.teamflow.backend.services.JornadaService;
import org.junit.jupiter.api.*;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class DeactivationV0523Tests {
    final TareaRepository tareas=mock(TareaRepository.class);
    final UsuarioRepository usuarios=mock(UsuarioRepository.class);
    final EvidenciaTareaRepository archivos=mock(EvidenciaTareaRepository.class);
    final SessionRegistry sesiones=mock(SessionRegistry.class);
    final TipoTareaRepository tipos=mock(TipoTareaRepository.class);
    final UsernamePasswordAuthenticationToken auth=new UsernamePasswordAuthenticationToken("admin@fixture.test","unused");
    final Tarea tarea=new Tarea(); final Usuario admin=new Usuario();
    TareaController taskController() {return new TareaController(tareas,usuarios,mock(JornadaService.class),mock(RegistroTareaRepository.class));}
    @BeforeEach void setup() {
        admin.setId(1L);admin.setRol("admin");admin.setEstado("activo");admin.setEmail(auth.getName());
        when(usuarios.findByEmail(auth.getName())).thenReturn(Optional.of(admin));
        tarea.setId(2L);tarea.setVersion(4L);tarea.setTiempoAcumuladoMs(10L);tarea.setTiempoInicioMs(System.currentTimeMillis()-1000);
        when(tareas.findByIdForUpdate(2L)).thenReturn(Optional.of(tarea));
    }
    @Test void bajaObsoletaNoCambiaEstadoNiReloj() {
        Long anchor=tarea.getTiempoInicioMs();assertEquals(409,taskController().eliminarTarea(2L,auth,3L).getStatusCode().value());
        assertTrue(tarea.isActivo());assertEquals(anchor,tarea.getTiempoInicioMs());assertEquals(10L,tarea.getTiempoAcumuladoMs());verify(tareas,never()).save(any());
    }
    @Test void bajaConfirmadaPausaRelojSinBorrarDatos() {
        tarea.setBitacora("Conservar");assertEquals(204,taskController().eliminarTarea(2L,auth,4L).getStatusCode().value());
        assertFalse(tarea.isActivo());assertNull(tarea.getTiempoInicioMs());assertTrue(tarea.getTiempoAcumuladoMs()>=1010);assertEquals("Conservar",tarea.getBitacora());
        verify(tareas).save(tarea);verify(tareas,never()).delete(any());
    }
    @Test void cuentaObsoletaNoRevocaNiDesactiva() {
        var u=new Usuario();u.setId(9L);u.setVersion(4L);u.setEmail("worker@fixture.test");u.setEstado("activo");when(usuarios.findByIdForUpdate(9L)).thenReturn(Optional.of(u));
        var c=new UsuarioController(usuarios,mock(BCryptPasswordEncoder.class),sesiones);
        assertEquals(409,c.eliminarUsuario(9L,auth,3L).getStatusCode().value());assertEquals("activo",u.getEstado());verifyNoInteractions(sesiones);verify(usuarios,never()).save(any());
    }
    @Test void plantillaObsoletaNoSeDesactiva() {
        var t=new TipoTarea();t.setId(7L);t.setVersion(4L);when(tipos.findByIdForUpdate(7L)).thenReturn(Optional.of(t));
        assertEquals(409,new TipoTareaController(tipos).eliminar(7L,3L).getStatusCode().value());assertTrue(t.isActivo());verify(tipos,never()).save(any());
    }
    EvidenciaTarea archivo() {var e=new EvidenciaTarea();e.setTareaId(2L);when(archivos.findById(8L)).thenReturn(Optional.of(e));return e;}
    @Test void archivoObsoletoNoSeDesactivaYBloqueaLaTareaPadre() {
        var e=archivo();assertEquals(409,new EvidenciaTareaController(archivos,tareas,usuarios).eliminar(2L,8L,auth,3L).getStatusCode().value());
        assertTrue(e.isActivo());verify(tareas).findByIdForUpdate(2L);verify(archivos,never()).save(any());
    }
    @Test void archivoConfirmadoSoloRecibeBajaLogica() {
        var e=archivo();assertEquals(204,new EvidenciaTareaController(archivos,tareas,usuarios).eliminar(2L,8L,auth,4L).getStatusCode().value());
        assertFalse(e.isActivo());verify(archivos).save(e);verify(archivos,never()).delete(any());verify(tareas,never()).save(any());
    }
    @Test void revisionSigueBloqueandoBajaDeArchivo() {
        var e=archivo();tarea.setEstado("En Revisión");assertEquals(403,new EvidenciaTareaController(archivos,tareas,usuarios).eliminar(2L,8L,auth,4L).getStatusCode().value());
        assertTrue(e.isActivo());verify(archivos,never()).save(any());
    }
    @Test void versionMalformadaDevuelve400SinEscribir() throws Exception {
        MockMvcBuilders.standaloneSetup(taskController()).build().perform(delete("/api/tareas/2?version=no-valida").principal(auth)).andExpect(status().isBadRequest());
        verifyNoInteractions(tareas);
    }
}
