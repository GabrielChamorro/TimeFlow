package com.teamflow.backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.ServletInputStream;
import jakarta.servlet.ReadListener;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.io.ByteArrayInputStream;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.nio.charset.Charset;

@Component
public class RequestSizeLimitFilter extends OncePerRequestFilter {

    private static final long MAX_REQUEST_BYTES = 4L * 1024L * 1024L;
    // El endpoint de evidencias acepta un archivo de hasta 60 MB y el margen del formulario.
    private static final long MAX_UPLOAD_REQUEST_BYTES = 61L * 1024L * 1024L;

    public static long limitePara(String metodo, String ruta, String contenido) {
        if ("POST".equalsIgnoreCase(metodo)
                && ruta != null && ruta.matches("/api/tareas/[0-9]+/evidencias")
                && contenido != null && contenido.toLowerCase(java.util.Locale.ROOT).startsWith("multipart/form-data")) {
            return MAX_UPLOAD_REQUEST_BYTES;
        }
        return MAX_REQUEST_BYTES;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        long contentLength = request.getContentLengthLong();
        long limite = limitePara(request.getMethod(), request.getRequestURI(), request.getContentType());
        if (contentLength > limite) {
            rechazar(response);
            return;
        }

        // Las solicitudes sin Content-Length (p. ej. Transfer-Encoding: chunked)
        // no se podían verificar con el filtro anterior. Limitar la lectura en
        // memoria a 4 MiB + 1 byte antes de entregarlas al controlador.
        // Las cargas multipart válidas siguen bajo el límite propio de Spring
        // (spring.servlet.multipart.max-request-size=61MB), evitando duplicar
        // grandes archivos en memoria para validarlos.
        boolean cuerpo = "POST".equalsIgnoreCase(request.getMethod())
                || "PUT".equalsIgnoreCase(request.getMethod())
                || "PATCH".equalsIgnoreCase(request.getMethod());
        boolean cargaEvidencia = limite == MAX_UPLOAD_REQUEST_BYTES;
        if (contentLength < 0 && cuerpo && !cargaEvidencia) {
            byte[] recibidos = request.getInputStream().readNBytes((int) limite + 1);
            if (recibidos.length > limite) {
                rechazar(response);
                return;
            }
            filterChain.doFilter(new ReplayedBodyRequest(request, recibidos), response);
            return;
        }
        filterChain.doFilter(request, response);
    }

    private void rechazar(HttpServletResponse response) throws IOException {
        response.setStatus(HttpServletResponse.SC_REQUEST_ENTITY_TOO_LARGE);
        response.setCharacterEncoding("UTF-8");
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write("{\"message\":\"La solicitud supera el tamaño máximo permitido\"}");
    }

    /** Reenvía el cuerpo leído al controlador sin alterar el JSON recibido. */
    private static final class ReplayedBodyRequest extends HttpServletRequestWrapper {
        private final byte[] body;

        ReplayedBodyRequest(HttpServletRequest request, byte[] body) {
            super(request);
            this.body = body;
        }

        @Override
        public int getContentLength() { return body.length; }

        @Override
        public long getContentLengthLong() { return body.length; }

        @Override
        public ServletInputStream getInputStream() {
            ByteArrayInputStream input = new ByteArrayInputStream(body);
            return new ServletInputStream() {
                @Override public int read() { return input.read(); }
                @Override public boolean isFinished() { return input.available() == 0; }
                @Override public boolean isReady() { return true; }
                @Override public void setReadListener(ReadListener listener) {
                    throw new UnsupportedOperationException("Solo se admiten solicitudes síncronas");
                }
            };
        }

        @Override
        public BufferedReader getReader() {
            Charset charset;
            try {
                charset = getCharacterEncoding() == null
                        ? StandardCharsets.UTF_8 : Charset.forName(getCharacterEncoding());
            } catch (IllegalArgumentException ex) {
                charset = StandardCharsets.UTF_8;
            }
            return new BufferedReader(new InputStreamReader(getInputStream(), charset));
        }
    }
}
