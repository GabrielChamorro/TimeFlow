package com.teamflow.backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class RequestSizeLimitFilter extends OncePerRequestFilter {

    private static final long MAX_REQUEST_BYTES = 4L * 1024L * 1024L;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        long contentLength = request.getContentLengthLong();
        if (contentLength > MAX_REQUEST_BYTES) {
            response.setStatus(HttpServletResponse.SC_REQUEST_ENTITY_TOO_LARGE);
            response.setCharacterEncoding("UTF-8");
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write("{\"message\":\"La solicitud supera el tamaño máximo permitido\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }
}
