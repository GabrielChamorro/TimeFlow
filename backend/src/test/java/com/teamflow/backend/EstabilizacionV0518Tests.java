package com.teamflow.backend;

import com.teamflow.backend.controllers.*;
import com.teamflow.backend.models.*;
import com.teamflow.backend.repositories.*;
import com.teamflow.backend.services.JornadaService;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class EstabilizacionV0518Tests {
    @Test void editarContenidoReleeLaFilaBloqueadaYConservaPosicion() {
        usuario("admin");
        Tarea latest = tarea(); latest.setPosicionX(555d);
        Tarea old = new Tarea(); old.setNombre("Cambio de contenido");
        when(tareas.save(latest)).thenReturn(latest);
        assertEquals(200, controller.actualizarTarea(2L, old, auth).getStatusCode().value());
        assertEquals(555d, latest.getPosicionX());
        verify(tareas).findByIdForUpdate(2L);
        verify(tareas, never()).findById(2L);
    }
    @Test void excesoMultipartDevuelve413SinRedireccionDeAutenticacion() {
        assertEquals(413, new ApiExceptionHandler().archivoDemasiadoGrande().getStatusCode().value());
    }
    @Test void cuotaSeReleeTrasEsperarElBloqueoMysql() throws Exception {
        var method = EvidenciaTareaController.class.getMethod("subir", Long.class,
                org.springframework.web.multipart.MultipartFile.class, Authentication.class);
        assertEquals(org.springframework.transaction.annotation.Isolation.READ_COMMITTED,
                method.getAnnotation(org.springframework.transaction.annotation.Transactional.class).isolation());
    }
    private final TareaRepository tareas = mock(TareaRepository.class);
    private final UsuarioRepository usuarios = mock(UsuarioRepository.class);
    private final JornadaService jornadas = mock(JornadaService.class);
    private final Authentication auth = mock(Authentication.class);
    private final TareaController controller = new TareaController(tareas, usuarios, jornadas, mock(com.teamflow.backend.repositories.RegistroTareaRepository.class));

    private Usuario usuario(String rol) {
        Usuario u = new Usuario(); u.setId(1L); u.setNombre("Prueba"); u.setEmail("prueba@local.test"); u.setRol(rol);
        when(auth.getName()).thenReturn(u.getEmail());
        when(usuarios.findByEmail(u.getEmail())).thenReturn(Optional.of(u));
        return u;
    }
    private Tarea tarea() {
        Tarea t = new Tarea(); t.setId(2L); t.setNombre("Tarea"); t.setAsignadoUsuarioId(9L);
        t.setPosicionX(100d); t.setPosicionY(200d);
        when(tareas.findByIdForUpdate(2L)).thenReturn(Optional.of(t));
        when(tareas.findById(2L)).thenReturn(Optional.of(t));
        return t;
    }
    @Test void movimientoManualObsoletoNoSobrescribeOtraSesion() {
        usuario("admin"); Tarea t = tarea();
        assertEquals(409, controller.actualizarPosicionMapa(2L, Map.of("posicionX", 30d, "posicionY", 40d,
                "anteriorX", 90d, "anteriorY", 200d), auth).getStatusCode().value());
        assertEquals(100d, t.getPosicionX()); verify(tareas, never()).save(any());
    }
    @Test void movimientoManualExigeLaPosicionOriginal() {
        usuario("admin"); tarea();
        assertEquals(400, controller.actualizarPosicionMapa(2L, Map.of("posicionX", 30d, "posicionY", 40d), auth).getStatusCode().value());
        verify(tareas, never()).save(any());
    }
    @Test void movimientoManualActualSeGuarda() {
        usuario("admin"); Tarea t = tarea();
        when(tareas.save(t)).thenReturn(t);
        assertEquals(200, controller.actualizarPosicionMapa(2L, Map.of("posicionX", 30d, "posicionY", 40d,
                "anteriorX", 100d, "anteriorY", 200d), auth).getStatusCode().value());
        assertEquals(30d, t.getPosicionX());
    }
    @Test void descargaAjenaNoCargaElBlobEnMemoria() {
        usuario("trabajador"); tarea();
        EvidenciaTareaRepository archivos = mock(EvidenciaTareaRepository.class);
        EvidenciaTarea e = new EvidenciaTarea(); e.setTareaId(2L);
        when(archivos.findById(3L)).thenReturn(Optional.of(e));
        var c = new EvidenciaTareaController(archivos, tareas, usuarios);
        assertEquals(403, c.descargar(2L, 3L, auth).getStatusCode().value());
        verify(archivos, never()).findById(anyLong());
    }
    @Test void fechaInexistenteNoSeNormalizaSilenciosamente() {
        usuario("trabajador"); when(jornadas.tieneJornadaActiva(1L)).thenReturn(true);
        Tarea t = new Tarea(); t.setNombre("Fecha inválida"); t.setMeta("Meta válida"); t.setFechaLimite("2026-02-30T15:30");
        assertEquals(400, controller.crearTarea(t, auth).getStatusCode().value());
        verify(tareas, never()).save(any());
    }
    @Test void hora24NoSeAceptaComoMedianoche() {
        usuario("trabajador"); when(jornadas.tieneJornadaActiva(1L)).thenReturn(true);
        Tarea t = new Tarea(); t.setNombre("Hora inválida"); t.setMeta("Meta válida"); t.setFechaLimite("2030-12-01T18:00"); t.setFechaInicio("24:00");
        assertEquals(400, controller.crearTarea(t, auth).getStatusCode().value());
        verify(tareas, never()).save(any());
    }
    @Test void passwordUnicodeQueExcedeBcryptSeRechazaAntesDeCodificar() {
        BCryptPasswordEncoder encoder = mock(BCryptPasswordEncoder.class);
        Usuario u = new Usuario(); u.setNombre("Unicode"); u.setEmail("unicode@local.test");
        u.setPassword("ñ".repeat(40) + "A1");
        var c = new UsuarioController(usuarios, encoder, mock(com.teamflow.backend.security.SessionRegistry.class));
        assertEquals(400, c.crearUsuario(u).getStatusCode().value());
        verify(encoder, never()).encode(any()); verify(usuarios, never()).save(any());
    }
}
