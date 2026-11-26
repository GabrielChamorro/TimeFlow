package com.teamflow.backend;

import com.teamflow.backend.config.JwtService;
import com.teamflow.backend.controllers.EvidenciaTareaController;
import com.teamflow.backend.models.EvidenciaTarea;
import com.teamflow.backend.models.Tarea;
import com.teamflow.backend.models.Usuario;
import com.teamflow.backend.repositories.EvidenciaTareaRepository;
import com.teamflow.backend.repositories.TareaRepository;
import com.teamflow.backend.repositories.UsuarioRepository;
import com.teamflow.backend.security.RequestSizeLimitFilter;
import com.teamflow.backend.security.TaskAccessRules;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.Authentication;
import org.springframework.http.HttpStatus;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AuditoriaSeguridadV056Tests {
    private com.teamflow.backend.security.SessionRegistry activeSessions() {
        var sessions = mock(com.teamflow.backend.security.SessionRegistry.class);
        when(sessions.isActive(anyString(), anyLong())).thenReturn(true);
        return sessions;
    }

    private Usuario usuario(long id, String nombre, String rol) {
        Usuario u = new Usuario();
        u.setId(id);u.setNombre(nombre);u.setRol(rol);
        return u;
    }

    @Test void peticionJsonDeCincoMbSeRechazaPeroMultipartDeEvidenciaSePermite() {
        assertEquals(4L*1024*1024, RequestSizeLimitFilter.limitePara("POST", "/api/tareas", "application/json"));
        assertEquals(61L*1024*1024, RequestSizeLimitFilter.limitePara("POST", "/api/tareas/15/evidencias", "multipart/form-data; boundary=X"));
        assertEquals(4L*1024*1024, RequestSizeLimitFilter.limitePara("POST", "/api/tareas/15/evidencias", "application/json"));
        assertEquals(4L*1024*1024, RequestSizeLimitFilter.limitePara("POST", "/api/tareas/15/evidencias/3", "multipart/form-data"));
    }

    @Test void mismoNombreNoPermiteRobarUnaTareaConResponsablePorId() {
        UsuarioRepository repo=mock(UsuarioRepository.class);
        Usuario a=usuario(3L,"Alex","trabajador");
        Usuario b=usuario(4L,"Alex","trabajador");
        Tarea tarea=new Tarea();tarea.setAsignadoA("Alex");tarea.setAsignadoUsuarioId(3L);
        assertTrue(TaskAccessRules.responsable(a,tarea,repo));
        assertFalse(TaskAccessRules.responsable(b,tarea,repo));
    }

    @Test void nombreDuplicadoNoDaPermisosSobreUnaTareaAntigua() {
        UsuarioRepository repo=mock(UsuarioRepository.class);
        Usuario a=usuario(3L,"Alex","trabajador");
        Usuario b=usuario(4L,"Alex","trabajador");
        when(repo.findAllByNombreIgnoreCase("Alex")).thenReturn(List.of(a,b));
        Tarea tarea=new Tarea();tarea.setAsignadoA("Alex");
        assertFalse(TaskAccessRules.responsable(a,tarea,repo));
        assertFalse(TaskAccessRules.responsable(b,tarea,repo));
    }

    @Test void evidenciaAjenaNoSePuedeConsultarNiDescargar() {
        var evidencias=mock(EvidenciaTareaRepository.class);
        var tareas=mock(TareaRepository.class);
        var usuarios=mock(UsuarioRepository.class);
        Authentication auth=mock(Authentication.class);
        when(auth.getName()).thenReturn("otro@example.test");
        when(usuarios.findByEmail("otro@example.test"))
                .thenReturn(Optional.of(usuario(2L,"Alex","trabajador")));
        Tarea tarea = new Tarea();tarea.setId(10L);tarea.setAsignadoUsuarioId(1L);
        when(tareas.findById(10L)).thenReturn(Optional.of(tarea));
        EvidenciaTarea evidencia=new EvidenciaTarea();evidencia.setTareaId(10L);
        when(evidencias.findById(9L)).thenReturn(Optional.of(evidencia));
        var ctrl=new EvidenciaTareaController(evidencias,tareas,usuarios);
        assertEquals(HttpStatus.FORBIDDEN,ctrl.lista(10L,auth).getStatusCode());
        assertEquals(HttpStatus.FORBIDDEN,ctrl.descargar(10L,9L,auth).getStatusCode());
        verify(evidencias,never()).resumirPorTarea(anyLong());
    }

    @Test void jwtNoEsValidoSiOtraCuentaReutilizaElCorreo() {
        JwtService jwt=new JwtService("TimeFlow_Clave_Auditoria_2026_32_Bytes_Minimo", 3600000L, activeSessions());
        Usuario original=usuario(7L,"Ana","trabajador"); original.setEmail("ana@example.test");
        Usuario otro=usuario(8L,"Ana","trabajador");otro.setEmail("ana@example.test");
        String token=jwt.generateToken(original);
        assertTrue(jwt.isTokenValid(token,original));
        assertFalse(jwt.isTokenValid(token,otro));
    }
}
