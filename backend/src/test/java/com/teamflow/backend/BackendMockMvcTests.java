package com.teamflow.backend;

import tools.jackson.databind.json.JsonMapper;
import com.teamflow.backend.config.JwtAuthenticationFilter;
import com.teamflow.backend.config.JwtService;
import com.teamflow.backend.config.SecurityConfig;
import com.teamflow.backend.controllers.AuthController;
import com.teamflow.backend.controllers.MensajeController;
import com.teamflow.backend.controllers.TareaController;
import com.teamflow.backend.controllers.JornadaController;
import com.teamflow.backend.dto.JornadaResponse;
import com.teamflow.backend.services.JornadaService;
import com.teamflow.backend.controllers.TipoTareaController;
import com.teamflow.backend.controllers.UsuarioController;
import com.teamflow.backend.models.Mensaje;
import com.teamflow.backend.models.Tarea;
import com.teamflow.backend.models.TipoTarea;
import com.teamflow.backend.models.Usuario;
import com.teamflow.backend.repositories.MensajeRepository;
import com.teamflow.backend.repositories.TareaRepository;
import com.teamflow.backend.repositories.TipoTareaRepository;
import com.teamflow.backend.repositories.UsuarioRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.never;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = {
        AuthController.class,
        UsuarioController.class,
        TipoTareaController.class,
        TareaController.class,
        JornadaController.class,
        MensajeController.class
})
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, JwtService.class})
@TestPropertySource(properties = {
        "jwt.secret=TimeFlowJWT2026_Clave_Test_32Bytes_Minimo_123456789",
        "jwt.expiration-ms=86400000"
})
class BackendMockMvcTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JsonMapper objectMapper;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @MockitoBean
    private UsuarioRepository usuarioRepository;

    @MockitoBean
    private TareaRepository tareaRepository;

    @MockitoBean
    private TipoTareaRepository tipoTareaRepository;

    @MockitoBean
    private MensajeRepository mensajeRepository;

    @MockitoBean
    private JornadaService jornadaService;

    @Test
    @DisplayName("AUTO-01 - Login correcto devuelve JWT")
    void loginCorrectoDevuelveJwt() throws Exception {
        Usuario admin = usuario(2L, "Administrador Principal", "admin@teamflow.com", "admin", "activo");
        admin.setPasswordHash(passwordEncoder.encode("teamflow"));

        when(usuarioRepository.findByEmail("admin@teamflow.com")).thenReturn(Optional.of(admin));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "admin@teamflow.com",
                                  "password": "teamflow"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.user.rol").value("admin"))
                .andExpect(jsonPath("$.user.password").doesNotExist())
                .andExpect(jsonPath("$.user.passwordHash").doesNotExist());
    }

    @Test
    @DisplayName("AUTO-02 - Login con contraseña incorrecta devuelve 401")
    void loginIncorrectoDevuelve401() throws Exception {
        Usuario admin = usuario(2L, "Administrador Principal", "admin@teamflow.com", "admin", "activo");
        admin.setPasswordHash(passwordEncoder.encode("teamflow"));

        when(usuarioRepository.findByEmail("admin@teamflow.com")).thenReturn(Optional.of(admin));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "admin@teamflow.com",
                                  "password": "incorrecta"
                                }
                                """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Credenciales incorrectas"));
    }

    @Test
    @DisplayName("AUTO-03 - Endpoint protegido sin JWT devuelve 401")
    void endpointSinTokenDevuelve401() throws Exception {
        mockMvc.perform(get("/api/usuarios"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Sesión inválida o token ausente"));
    }

    @Test
    @DisplayName("AUTO-04 - JWT modificado devuelve 401")
    void tokenModificadoDevuelve401() throws Exception {
        Usuario trabajador = usuario(1L, "Gabriel Chamorro", "gabriel@teamflow.com", "trabajador", "activo");
        String tokenValido = jwtService.generateToken(trabajador);

        // cambia un caracter de la firma para que deje de ser valida
        int inicioFirma = tokenValido.lastIndexOf('.') + 1;
        char original = tokenValido.charAt(inicioFirma);
        char cambiado = original == 'A' ? 'B' : 'A';
        String tokenModificado = tokenValido.substring(0, inicioFirma)
                + cambiado
                + tokenValido.substring(inicioFirma + 1);

        mockMvc.perform(get("/api/usuarios")
                        .header("Authorization", "Bearer " + tokenModificado))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("AUTO-05 - Trabajador no puede crear usuarios")
    void trabajadorNoPuedeCrearUsuario() throws Exception {
        Usuario trabajador = usuario(1L, "Gabriel Chamorro", "gabriel@teamflow.com", "trabajador", "activo");
        String token = jwtService.generateToken(trabajador);

        when(usuarioRepository.findByEmail("gabriel@teamflow.com")).thenReturn(Optional.of(trabajador));

        mockMvc.perform(post("/api/usuarios")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "nombre": "Usuario de prueba",
                                  "email": "prueba@teamflow.com",
                                  "password": "teamflow",
                                  "rol": "trabajador",
                                  "estado": "activo"
                                }
                                """))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("AUTO-06 - Token de una cuenta inactiva deja de funcionar")
    void cuentaInactivaNoPuedeUsarTokenAnterior() throws Exception {
        Usuario trabajadorActivo = usuario(1L, "Gabriel Chamorro", "gabriel@teamflow.com", "trabajador", "activo");
        String token = jwtService.generateToken(trabajadorActivo);

        // simula que la cuenta fue desactivada despues de obtener el token
        Usuario trabajadorInactivo = usuario(1L, "Gabriel Chamorro", "gabriel@teamflow.com", "trabajador", "inactivo");
        when(usuarioRepository.findByEmail("gabriel@teamflow.com")).thenReturn(Optional.of(trabajadorInactivo));

        mockMvc.perform(get("/api/usuarios")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("AUTO-07 - Tipo de tarea duplicado devuelve 409")
    void tipoDuplicadoDevuelve409() throws Exception {
        Usuario admin = usuario(2L, "Administrador Principal", "admin@teamflow.com", "admin", "activo");
        String token = jwtService.generateToken(admin);

        TipoTarea existente = new TipoTarea("Inventario", "Tipo existente");
        existente.setId(10L);

        when(usuarioRepository.findByEmail("admin@teamflow.com")).thenReturn(Optional.of(admin));
        when(tipoTareaRepository.findByNombreIgnoreCase("Inventario")).thenReturn(Optional.of(existente));

        mockMvc.perform(post("/api/tipos-tarea")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "nombre": "Inventario",
                                  "descripcion": "Duplicado intencional"
                                }
                                """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Ya existe un tipo de tarea con ese nombre"));
    }

    @Test
    @DisplayName("AUTO-08 - Tarea sin nombre devuelve 400")
    void tareaSinNombreDevuelve400() throws Exception {
        Usuario trabajador = usuario(1L, "Gabriel Chamorro", "gabriel@teamflow.com", "trabajador", "activo");
        String token = jwtService.generateToken(trabajador);

        when(usuarioRepository.findByEmail("gabriel@teamflow.com")).thenReturn(Optional.of(trabajador));

        mockMvc.perform(post("/api/tareas")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "descripcion": "No tiene nombre",
                                  "tipo": "Custom",
                                  "fechaInicio": "12:00",
                                  "fechaLimite": "18:00"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("El nombre de la tarea es obligatorio"));
    }

    @Test
    @DisplayName("AUTO-08B - Tarea nueva recibe la fecha actual")
    void tareaNuevaRecibeFechaActual() throws Exception {
        Usuario trabajador = usuario(1L, "Gabriel Chamorro", "gabriel@teamflow.com", "trabajador", "activo");
        String token = jwtService.generateToken(trabajador);

        when(usuarioRepository.findByEmail("gabriel@teamflow.com")).thenReturn(Optional.of(trabajador));
        when(jornadaService.tieneJornadaActiva(1L)).thenReturn(true);
        when(tareaRepository.save(any(Tarea.class))).thenAnswer(invocacion -> {
            Tarea tarea = invocacion.getArgument(0);
            tarea.setId(25L);
            return tarea;
        });

        mockMvc.perform(post("/api/tareas")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "nombre": "Tarea con fecha",
                                  "codigo": "NODE-ATAQUE",
                                  "descripcion": "Prueba de fecha automática",
                                  "tipo": "Custom",
                                  "fecha": "2000-01-01",
                                  "fechaInicio": "12:00",
                                  "fechaLimite": "2030-05-12T18:00"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.fecha").value(LocalDate.now().toString()))
                .andExpect(jsonPath("$.codigo", org.hamcrest.Matchers.matchesPattern("NODE-[A-F0-9]{16}")))
                .andExpect(jsonPath("$.fechaInicio").value("12:00"))
                .andExpect(jsonPath("$.fechaLimite").value("2030-05-12T18:00"));
    }

    @Test
    @DisplayName("AUTO-08C - Hora límite antigua se completa con la fecha de la tarea")
    void horaLimiteAntiguaSeCompletaConFecha() throws Exception {
        Usuario trabajador = usuario(1L, "Gabriel Chamorro", "gabriel@teamflow.com", "trabajador", "activo");
        String token = jwtService.generateToken(trabajador);

        when(usuarioRepository.findByEmail("gabriel@teamflow.com")).thenReturn(Optional.of(trabajador));
        when(jornadaService.tieneJornadaActiva(1L)).thenReturn(true);
        when(tareaRepository.save(any(Tarea.class))).thenAnswer(invocacion -> {
            Tarea tarea = invocacion.getArgument(0);
            tarea.setId(26L);
            return tarea;
        });

        mockMvc.perform(post("/api/tareas")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "nombre": "Compatibilidad límite",
                                  "fechaLimite": "18:00"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.fechaLimite").value(LocalDate.now().toString() + "T18:00"));
    }

    @Test
    @DisplayName("AUTO-09 - Trabajador no puede editar tarea ajena")
    void trabajadorNoPuedeEditarTareaAjena() throws Exception {
        Usuario gabriel = usuario(1L, "Gabriel Chamorro", "gabriel@teamflow.com", "trabajador", "activo");
        String token = jwtService.generateToken(gabriel);

        Tarea tareaAndrea = new Tarea();
        tareaAndrea.setId(28L);
        tareaAndrea.setNombre("Tarea de Andrea");
        tareaAndrea.setAsignadoA("Andrea Ortega");
        tareaAndrea.setEstado("En Progreso");

        when(usuarioRepository.findByEmail("gabriel@teamflow.com")).thenReturn(Optional.of(gabriel));
        when(tareaRepository.findById(28L)).thenReturn(Optional.of(tareaAndrea));

        mockMvc.perform(put("/api/tareas/28")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "nombre": "Intento de cambio",
                                  "estado": "En Progreso"
                                }
                                """))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Solo el responsable de la tarea puede modificarla"));
    }

    @Test
    @DisplayName("AUTO-10 - Tarea finalizada no puede editarse")
    void tareaFinalizadaQuedaBloqueada() throws Exception {
        Usuario admin = usuario(2L, "Administrador Principal", "admin@teamflow.com", "admin", "activo");
        String token = jwtService.generateToken(admin);

        Tarea finalizada = new Tarea();
        finalizada.setId(30L);
        finalizada.setNombre("Tarea terminada");
        finalizada.setAsignadoA("Gabriel Chamorro");
        finalizada.setEstado("Finalizada");

        when(usuarioRepository.findByEmail("admin@teamflow.com")).thenReturn(Optional.of(admin));
        when(tareaRepository.findById(30L)).thenReturn(Optional.of(finalizada));

        mockMvc.perform(put("/api/tareas/30")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "nombre": "Intento de cambio",
                                  "estado": "Finalizada"
                                }
                                """))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("La tarea finalizada está bloqueada"));
    }

    @Test
    @DisplayName("AUTO-11 - Trabajador no puede publicar anuncios")
    void trabajadorNoPuedePublicarAnuncio() throws Exception {
        Usuario trabajador = usuario(1L, "Gabriel Chamorro", "gabriel@teamflow.com", "trabajador", "activo");
        String token = jwtService.generateToken(trabajador);

        when(usuarioRepository.findByEmail("gabriel@teamflow.com")).thenReturn(Optional.of(trabajador));

        mockMvc.perform(post("/api/mensajes")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "chatId": "announcements",
                                  "text": "Intento de anuncio",
                                  "timestamp": "12:00"
                                }
                                """))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Solo un administrador puede publicar anuncios oficiales"));
    }

    @Test
    @DisplayName("AUTO-12 - Admin puede publicar anuncios")
    void adminPuedePublicarAnuncio() throws Exception {
        Usuario admin = usuario(2L, "Administrador Principal", "admin@teamflow.com", "admin", "activo");
        String token = jwtService.generateToken(admin);

        when(usuarioRepository.findByEmail("admin@teamflow.com")).thenReturn(Optional.of(admin));
        when(mensajeRepository.save(any(Mensaje.class))).thenAnswer(invocacion -> {
            Mensaje mensaje = invocacion.getArgument(0);
            mensaje.setId(50L);
            return mensaje;
        });

        mockMvc.perform(post("/api/mensajes")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "chatId": "announcements",
                                  "text": "Anuncio oficial",
                                  "timestamp": "12:00"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.senderId").value(2))
                .andExpect(jsonPath("$.senderRole").value("admin"));
    }

    @Test
    @DisplayName("AUTO-13 - Admin puede guardar la posición de una tarea en el mapa")
    void adminPuedeGuardarPosicionMapa() throws Exception {
        Usuario admin = usuario(2L, "Administrador Principal", "admin@teamflow.com", "admin", "activo");
        String token = jwtService.generateToken(admin);

        Tarea tarea = new Tarea();
        tarea.setId(40L);
        tarea.setNombre("Tarea en mapa");
        tarea.setAsignadoA("Gabriel Chamorro");
        tarea.setEstado("Finalizada");

        when(usuarioRepository.findByEmail("admin@teamflow.com")).thenReturn(Optional.of(admin));
        when(tareaRepository.findById(40L)).thenReturn(Optional.of(tarea));
        when(tareaRepository.save(any(Tarea.class))).thenAnswer(invocacion -> invocacion.getArgument(0));

        mockMvc.perform(patch("/api/tareas/40/posicion")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "posicionX": 520,
                                  "posicionY": 340
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.posicionX").value(520.0))
                .andExpect(jsonPath("$.posicionY").value(340.0));
    }

    @Test
    @DisplayName("AUTO-14 - Trabajador no puede cambiar la posición de tareas en el mapa")
    void trabajadorNoPuedeGuardarPosicionMapa() throws Exception {
        Usuario trabajador = usuario(1L, "Gabriel Chamorro", "gabriel@teamflow.com", "trabajador", "activo");
        String token = jwtService.generateToken(trabajador);

        when(usuarioRepository.findByEmail("gabriel@teamflow.com")).thenReturn(Optional.of(trabajador));

        mockMvc.perform(patch("/api/tareas/40/posicion")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "posicionX": 520,
                                  "posicionY": 340
                                }
                                """))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Solo un administrador puede cambiar la posición de las tareas"));
    }


    @Test
    @DisplayName("S4-01 - Admin no puede crear usuario con contraseña débil")
    void passwordDebilEsRechazada() throws Exception {
        Usuario admin = usuario(2L, "Administrador Principal", "admin@teamflow.com", "admin", "activo");
        String token = jwtService.generateToken(admin);
        when(usuarioRepository.findByEmail("admin@teamflow.com")).thenReturn(Optional.of(admin));

        mockMvc.perform(post("/api/usuarios")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "nombre": "Usuario Nuevo",
                                  "email": "nuevo@teamflow.com",
                                  "password": "sololetras",
                                  "rol": "trabajador",
                                  "estado": "activo"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("La contraseña debe incluir al menos una letra y un número"));
    }

    @Test
    @DisplayName("S4-02 - Evidencia con formato no permitido es rechazada")
    void evidenciaInvalidaEsRechazada() throws Exception {
        Usuario trabajador = usuario(1L, "Gabriel Chamorro", "gabriel@teamflow.com", "trabajador", "activo");
        String token = jwtService.generateToken(trabajador);
        when(usuarioRepository.findByEmail("gabriel@teamflow.com")).thenReturn(Optional.of(trabajador));

        mockMvc.perform(post("/api/tareas")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "nombre": "Tarea con evidencia falsa",
                                  "evidencia": "data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg=="
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Solo se permiten imágenes PNG, JPG/JPEG, GIF o WEBP"));
    }

    @Test
    @DisplayName("S4-03 - Tarea finalizada no puede eliminarse ni por admin")
    void tareaFinalizadaNoPuedeEliminarse() throws Exception {
        Usuario admin = usuario(2L, "Administrador Principal", "admin@teamflow.com", "admin", "activo");
        String token = jwtService.generateToken(admin);
        Tarea finalizada = new Tarea();
        finalizada.setId(60L);
        finalizada.setNombre("Historial protegido");
        finalizada.setAsignadoA("Gabriel Chamorro");
        finalizada.setEstado("Finalizada");

        when(usuarioRepository.findByEmail("admin@teamflow.com")).thenReturn(Optional.of(admin));
        when(tareaRepository.findById(60L)).thenReturn(Optional.of(finalizada));

        mockMvc.perform(delete("/api/tareas/60")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("La tarea finalizada está bloqueada y no puede eliminarse"));
    }

    @Test
    @DisplayName("S4-04 - Mensaje excesivamente largo es rechazado")
    void mensajeMuyLargoEsRechazado() throws Exception {
        Usuario trabajador = usuario(1L, "Gabriel Chamorro", "gabriel@teamflow.com", "trabajador", "activo");
        String token = jwtService.generateToken(trabajador);
        when(usuarioRepository.findByEmail("gabriel@teamflow.com")).thenReturn(Optional.of(trabajador));

        String json = objectMapper.writeValueAsString(java.util.Map.of(
                "chatId", "general",
                "text", "a".repeat(2001)
        ));

        mockMvc.perform(post("/api/mensajes")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("El mensaje no puede superar 2000 caracteres"));
    }

    @Test
    @DisplayName("S4-05 - Rol no reconocido es rechazado")
    void rolInvalidoEsRechazado() throws Exception {
        Usuario admin = usuario(2L, "Administrador Principal", "admin@teamflow.com", "admin", "activo");
        String token = jwtService.generateToken(admin);
        when(usuarioRepository.findByEmail("admin@teamflow.com")).thenReturn(Optional.of(admin));

        mockMvc.perform(post("/api/usuarios")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "nombre": "Usuario Nuevo",
                                  "email": "nuevo2@teamflow.com",
                                  "password": "Segura2026",
                                  "rol": "superadmin",
                                  "estado": "activo"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("El rol indicado no es válido"));
    }

    @Test
    @DisplayName("S4-06 - Estado arbitrario de tarea es rechazado incluso para admin")
    void estadoArbitrarioDeTareaEsRechazado() throws Exception {
        Usuario admin = usuario(2L, "Administrador Principal", "admin@teamflow.com", "admin", "activo");
        String token = jwtService.generateToken(admin);
        Tarea tarea = new Tarea();
        tarea.setId(61L);
        tarea.setNombre("Tarea editable");
        tarea.setAsignadoA("Gabriel Chamorro");
        tarea.setEstado("En Progreso");

        when(usuarioRepository.findByEmail("admin@teamflow.com")).thenReturn(Optional.of(admin));
        when(tareaRepository.findById(61L)).thenReturn(Optional.of(tarea));

        mockMvc.perform(put("/api/tareas/61")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "nombre": "Tarea editable",
                                  "estado": "Estado Inventado"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Cambio de estado no permitido"));
    }

    @Test
    @DisplayName("S4-J01 - Consultar jornada sin JWT devuelve 401")
    void jornadaSinJwtSeRechaza() throws Exception {
        mockMvc.perform(get("/api/jornadas/actual")).andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/jornadas/check-in")).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("S4-J02 - Usuario obtiene su jornada desde el servidor")
    void consultaJornadaPropia() throws Exception {
        Usuario trabajador = usuario(1L, "Gabriel Chamorro", "gabriel@teamflow.com", "trabajador", "activo");
        when(usuarioRepository.findByEmail(trabajador.getEmail())).thenReturn(Optional.of(trabajador));
        when(jornadaService.obtenerUltima(1L)).thenReturn(Optional.of(
                new JornadaResponse(10L, "2026-10-24T10:00Z", null, true, null)));
        mockMvc.perform(get("/api/jornadas/actual")
                        .header("Authorization", "Bearer " + jwtService.generateToken(trabajador)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.activa").value(true))
                .andExpect(jsonPath("$.checkInAt").value("2026-10-24T10:00Z"));
    }

    @Test
    @DisplayName("S4-J02B - Sin historial propio responde 204 sin inventar registros")
    void sinHistorialJornada() throws Exception {
        Usuario trabajador = usuario(1L, "Gabriel Chamorro", "gabriel@teamflow.com", "trabajador", "activo");
        when(usuarioRepository.findByEmail(trabajador.getEmail())).thenReturn(Optional.of(trabajador));
        mockMvc.perform(get("/api/jornadas/actual")
                        .header("Authorization", "Bearer " + jwtService.generateToken(trabajador)))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("S4-J03 - Registrar Check In crea jornada de usuario autenticado")
    void checkInPersistido() throws Exception {
        Usuario trabajador = usuario(1L, "Gabriel Chamorro", "gabriel@teamflow.com", "trabajador", "activo");
        when(usuarioRepository.findByEmail(trabajador.getEmail())).thenReturn(Optional.of(trabajador));
        when(jornadaService.registrarEntrada(1L)).thenReturn(Optional.of(
                new JornadaResponse(10L, "2026-10-24T10:00Z", null, true, null)));
        mockMvc.perform(post("/api/jornadas/check-in")
                        .header("Authorization", "Bearer " + jwtService.generateToken(trabajador)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(10));
        verify(jornadaService).registrarEntrada(1L);
    }

    @Test
    @DisplayName("S4-J04 - Doble Check In devuelve 409")
    void checkInDuplicadoEsRechazado() throws Exception {
        Usuario trabajador = usuario(1L, "Gabriel Chamorro", "gabriel@teamflow.com", "trabajador", "activo");
        when(usuarioRepository.findByEmail(trabajador.getEmail())).thenReturn(Optional.of(trabajador));
        when(jornadaService.registrarEntrada(1L)).thenReturn(Optional.empty());
        mockMvc.perform(post("/api/jornadas/check-in")
                        .header("Authorization", "Bearer " + jwtService.generateToken(trabajador)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Ya tienes una jornada activa"));
    }

    @Test
    @DisplayName("S4-J05 - Sin jornada activa no permite crear tareas desde la API")
    void tareaSinCheckInEsRechazadaPorBackend() throws Exception {
        Usuario trabajador = usuario(1L, "Gabriel Chamorro", "gabriel@teamflow.com", "trabajador", "activo");
        when(usuarioRepository.findByEmail(trabajador.getEmail())).thenReturn(Optional.of(trabajador));
        mockMvc.perform(post("/api/tareas")
                        .header("Authorization", "Bearer " + jwtService.generateToken(trabajador))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nombre":"Intento sin jornada", "fechaLimite":"2030-12-01T18:00"}
                                """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Debes registrar Check In antes de crear una tarea"));
        verify(tareaRepository, never()).save(any(Tarea.class));
    }

    @Test
    @DisplayName("S4-J06 - Check Out deja la jornada cerrada y devuelve duración")
    void checkOutPersistido() throws Exception {
        Usuario trabajador = usuario(1L, "Gabriel Chamorro", "gabriel@teamflow.com", "trabajador", "activo");
        when(usuarioRepository.findByEmail(trabajador.getEmail())).thenReturn(Optional.of(trabajador));
        when(jornadaService.registrarSalida(1L)).thenReturn(Optional.of(
                new JornadaResponse(10L, "2026-10-24T10:00Z", "2026-10-24T11:30Z", false, 5400L)));
        mockMvc.perform(post("/api/jornadas/check-out")
                        .header("Authorization", "Bearer " + jwtService.generateToken(trabajador)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.activa").value(false))
                .andExpect(jsonPath("$.duracionSegundos").value(5400));
    }

    @Test
    @DisplayName("S4-J07 - No permite Check Out sin Check In")
    void checkOutSinJornadaEsRechazado() throws Exception {
        Usuario trabajador = usuario(1L, "Gabriel Chamorro", "gabriel@teamflow.com", "trabajador", "activo");
        when(usuarioRepository.findByEmail(trabajador.getEmail())).thenReturn(Optional.of(trabajador));
        mockMvc.perform(post("/api/jornadas/check-out")
                        .header("Authorization", "Bearer " + jwtService.generateToken(trabajador)))
                .andExpect(status().isConflict());
    }

    private Usuario usuario(Long id, String nombre, String email, String rol, String estado) {
        Usuario usuario = new Usuario();
        usuario.setId(id);
        usuario.setNombre(nombre);
        usuario.setEmail(email);
        usuario.setRol(rol);
        usuario.setEstado(estado);
        return usuario;
    }
}
