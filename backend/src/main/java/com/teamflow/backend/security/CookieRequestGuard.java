package com.teamflow.backend.security;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.net.URI;
import java.util.List;

/** CSRF por cabecera no simple + Origin exacto en todas las operaciones con cookie. */
public class CookieRequestGuard extends OncePerRequestFilter {
    private final List<String> origins;
    private final boolean localHttp;
    public CookieRequestGuard(List<String> origins, boolean localHttp) {
        if (origins.isEmpty() || origins.stream().anyMatch(o->o.contains("*") || o.equals("null")))
            throw new IllegalArgumentException("CORS de sesiÃ³n requiere orÃ­genes explÃ­citos");
        if (localHttp && origins.stream().anyMatch(o -> !loopback(URI.create(o).getHost())))
            throw new IllegalArgumentException("HTTP de desarrollo solo admite orÃ­genes loopback");
        if (!localHttp && origins.stream().anyMatch(o -> !o.startsWith("https://")))
            throw new IllegalArgumentException("En producciÃ³n los orÃ­genes deben usar HTTPS");
        this.origins=origins; this.localHttp=localHttp;
    }
    private static boolean loopback(String host) {
        return "localhost".equalsIgnoreCase(host) || "127.0.0.1".equals(host) || "::1".equals(host) || "[::1]".equals(host);
    }
    @Override protected void doFilterInternal(HttpServletRequest req,HttpServletResponse res,FilterChain chain) throws ServletException,IOException {
        if ("POST".equals(req.getMethod()) && List.of("/api/auth/login","/api/auth/refresh","/api/auth/logout").contains(req.getRequestURI().substring(req.getContextPath().length()))) {
            boolean transport=req.isSecure() || (localHttp && loopback(req.getServerName()) && loopback(req.getRemoteAddr()));
            if (!transport || req.getHeader("Origin")==null || !origins.contains(req.getHeader("Origin")) || !"1".equals(req.getHeader("X-TimeFlow-CSRF"))) {
                res.setStatus(403); res.setContentType("application/json");
                res.getWriter().write("{\"message\":\"Solicitud de sesiÃ³n no autorizada\"}");return;
            }
        }
        chain.doFilter(req,res);
    }
}
