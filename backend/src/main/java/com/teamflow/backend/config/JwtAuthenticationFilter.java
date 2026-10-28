package com.teamflow.backend.config;

import com.teamflow.backend.models.Usuario;
import com.teamflow.backend.repositories.UsuarioRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UsuarioRepository usuarioRepository;

    public JwtAuthenticationFilter(JwtService jwtService, UsuarioRepository usuarioRepository) {
        this.jwtService = jwtService;
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        // toma el token que viene desde el frontend
        String authHeader = request.getHeader("Authorization");

        // si no viene token deja que spring siga con la solicitud
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7);

        try {
            // saca el correo guardado dentro del token
            String email = jwtService.extractEmail(token);

            if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                // busca el usuario real en la base de datos
                Optional<Usuario> usuarioOpt = usuarioRepository.findByEmail(email);

                if (usuarioOpt.isPresent()) {
                    Usuario usuario = usuarioOpt.get();
                    boolean activo = usuario.getEstado() == null
                            || !"inactivo".equalsIgnoreCase(usuario.getEstado());

                    // si sigue activo y el token es valido deja la sesion autenticada
                    if (activo && jwtService.isTokenValid(token, usuario)) {
                        String rol = usuario.getRol() == null
                                ? "TRABAJADOR"
                                : usuario.getRol().toUpperCase(Locale.ROOT);

                        var permisos = List.of(new SimpleGrantedAuthority("ROLE_" + rol));
                        var authentication = new UsernamePasswordAuthenticationToken(
                                usuario.getEmail(),
                                null,
                                permisos
                        );

                        authentication.setDetails(
                                new WebAuthenticationDetailsSource().buildDetails(request)
                        );

                        SecurityContextHolder.getContext().setAuthentication(authentication);
                    }
                }
            }
        } catch (Exception ignored) {
            // si el token esta vencido o mal formado no autentica al usuario
        }

        filterChain.doFilter(request, response);
    }
}
