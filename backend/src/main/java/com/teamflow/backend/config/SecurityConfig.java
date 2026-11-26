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
    private final boolean localHttp;

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthenticationFilter,
            @Value("${app.cors.allowed-origins:http://localhost:5173}") String allowedOrigins, @Value("${app.auth.local-http:false}") boolean localHttp) {
        this.localHttp=localHttp;
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
            // El filtro CookieRequestGuard exige Origin exacto + cabecera no simple en login/refresh/logout.
            // El resto de API solo admite Bearer explícito y no autentica mediante cookies.
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers("/api/auth/login", "/api/auth/refresh", "/api/auth/logout").permitAll()

                // Las listas completas (incluidos registros inactivos) son solo para administradores.
                .requestMatchers(HttpMethod.GET, "/api/usuarios/administracion", "/api/tipos-tarea/administracion").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/usuarios", "/api/usuarios/**").authenticated()
                .requestMatchers(HttpMethod.POST, "/api/usuarios", "/api/usuarios/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/usuarios/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PATCH, "/api/usuarios/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/usuarios/**").hasRole("ADMIN")

                .requestMatchers(HttpMethod.GET, "/api/tipos-tarea", "/api/tipos-tarea/**").authenticated()
                .requestMatchers(HttpMethod.POST, "/api/tipos-tarea", "/api/tipos-tarea/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/tipos-tarea/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PATCH, "/api/tipos-tarea/**").hasRole("ADMIN")
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
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(new com.teamflow.backend.security.CookieRequestGuard(allowedOrigins,localHttp), JwtAuthenticationFilter.class);

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
        CorsConfiguration auth = new CorsConfiguration(config);
        auth.setAllowedHeaders(List.of("Content-Type","Authorization","X-TimeFlow-CSRF"));
        auth.setAllowCredentials(true);
        source.registerCorsConfiguration("/api/auth/**",auth);
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
