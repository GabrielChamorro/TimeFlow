package com.teamflow.backend.config;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final List<String> allowedOrigins;

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthenticationFilter,
            @Value("${app.cors.allowed-origins:http://localhost:5173}") String allowedOrigins) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.allowedOrigins = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isBlank())
                .toList();
    }

    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // La API usa JWT en Authorization y no cookies de sesión, por eso CSRF no aplica
            // al modelo actual de autenticación.
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers("/api/auth/login").permitAll()

                .requestMatchers(HttpMethod.GET, "/api/usuarios", "/api/usuarios/**").authenticated()
                .requestMatchers(HttpMethod.POST, "/api/usuarios", "/api/usuarios/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/usuarios/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/usuarios/**").hasRole("ADMIN")

                .requestMatchers(HttpMethod.GET, "/api/tipos-tarea", "/api/tipos-tarea/**").authenticated()
                .requestMatchers(HttpMethod.POST, "/api/tipos-tarea", "/api/tipos-tarea/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/tipos-tarea/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/tipos-tarea/**").hasRole("ADMIN")

                .requestMatchers("/api/jornadas", "/api/jornadas/**").authenticated()
                .requestMatchers("/api/tareas", "/api/tareas/**").authenticated()
                .requestMatchers("/api/mensajes", "/api/mensajes/**").authenticated()
                .anyRequest().authenticated()
            )
            .exceptionHandling(exceptions -> exceptions
                .authenticationEntryPoint((request, response, ex) -> {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setCharacterEncoding("UTF-8");
                    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    response.getWriter().write("{\"message\":\"Sesión inválida o token ausente\"}");
                })
                .accessDeniedHandler((request, response, ex) -> {
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.setCharacterEncoding("UTF-8");
                    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    response.getWriter().write("{\"message\":\"No tienes permisos para realizar esta acción\"}");
                })
            )
            .headers(headers -> headers
                .frameOptions(frame -> frame.deny())
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(allowedOrigins);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Content-Type", "Authorization"));
        // TimeFlow usa Bearer JWT y no necesita cookies cross-origin.
        config.setAllowCredentials(false);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
