package com.teamflow.backend;

import com.teamflow.backend.controllers.TareaController;
import com.teamflow.backend.repositories.TareaRepository;
import com.teamflow.backend.security.RequestSizeLimitFilter;
import org.junit.jupiter.api.Test;
import org.springframework.data.jpa.repository.Query;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.*;

class SeguridadV0514Tests {
    private MockHttpServletRequest solicitudSinLongitud(byte[] cuerpo) {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/tareas") {
            @Override public long getContentLengthLong() { return -1L; }
            @Override public int getContentLength() { return -1; }
        };
        request.setContentType("application/json");
        request.setContent(cuerpo);
        return request;
    }

    @Test void rechazaCuerpoChunkedQueSuperaCuatroMiB() throws Exception {
        MockHttpServletRequest request = solicitudSinLongitud(new byte[4 * 1024 * 1024 + 1]);
        MockHttpServletResponse response = new MockHttpServletResponse();
        AtomicBoolean llegoAlControlador = new AtomicBoolean();
        new RequestSizeLimitFilter().doFilter(request, response,
                (req, res) -> llegoAlControlador.set(true));
        assertEquals(413, response.getStatus());
        assertFalse(llegoAlControlador.get());
    }

    @Test void reenviaCuerpoPequenoIntegroSinLongitudDeclarada() throws Exception {
        String json = "{\"nombre\":\"Prueba\"}";
        MockHttpServletResponse response = new MockHttpServletResponse();
        AtomicReference<String> recibido = new AtomicReference<>();
        new RequestSizeLimitFilter().doFilter(
                solicitudSinLongitud(json.getBytes(StandardCharsets.UTF_8)), response,
                (req, res) -> {
                    assertEquals(json.getBytes(StandardCharsets.UTF_8).length, req.getContentLengthLong());
                    recibido.set(new String(req.getInputStream().readAllBytes(), StandardCharsets.UTF_8));
                });
        assertEquals(json, recibido.get());
        assertEquals(200, response.getStatus());
    }

    @Test void mantieneLimiteMultipartEspecialDeEvidencias() {
        assertEquals(61L * 1024 * 1024, RequestSizeLimitFilter.limitePara(
                "POST", "/api/tareas/42/evidencias", "multipart/form-data; boundary=abc"));
    }

    @Test void laValidacionConcurrenteDeclaraBloqueoYLecturasConfirmadas() throws Exception {
        Query bloqueo = TareaRepository.class.getMethod("bloquearRedDependencias").getAnnotation(Query.class);
        assertNotNull(bloqueo);
        assertTrue(bloqueo.nativeQuery());
        assertTrue(bloqueo.value().toUpperCase(java.util.Locale.ROOT).contains("FOR UPDATE"));
        Transactional crear = TareaController.class.getMethod("crearTarea",
                com.teamflow.backend.models.Tarea.class,
                org.springframework.security.core.Authentication.class).getAnnotation(Transactional.class);
        Transactional editar = TareaController.class.getMethod("actualizarTarea",
                Long.class, com.teamflow.backend.models.Tarea.class,
                org.springframework.security.core.Authentication.class).getAnnotation(Transactional.class);
        assertNotNull(crear);
        assertNotNull(editar);
        assertEquals(Isolation.READ_COMMITTED, crear.isolation());
        assertEquals(Isolation.READ_COMMITTED, editar.isolation());
    }
}
