package com.teamflow.backend.controllers;

import com.teamflow.backend.models.Tarea;
import com.teamflow.backend.models.Usuario;
import com.teamflow.backend.repositories.TareaRepository;
import com.teamflow.backend.repositories.UsuarioRepository;
import com.teamflow.backend.security.InputSecurity;
import com.teamflow.backend.services.JornadaService;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/tareas")
public class TareaController {

    private static final int MAX_NOMBRE = 180;
    private static final int MAX_DESCRIPCION = 3000;
    private static final int MAX_TIPO = 100;
    private static final int MAX_ASIGNADO = 120;
    private static final int MAX_META = 500;
    private static final int MAX_BITACORA = 10000;

    private final TareaRepository tareaRepository;
    private final UsuarioRepository usuarioRepository;
    private final JornadaService jornadaService;

    public TareaController(TareaRepository tareaRepository, UsuarioRepository usuarioRepository, JornadaService jornadaService) {
        this.tareaRepository = tareaRepository;
        this.usuarioRepository = usuarioRepository;
        this.jornadaService = jornadaService;
    }

    @GetMapping
    public ResponseEntity<List<Tarea>> listarTareas() {
        return ResponseEntity.ok(tareaRepository.findAll());
    }

    @PostMapping
    @Transactional // Mantiene el bloqueo del usuario hasta guardar la tarea (evita carrera con Check Out).
    public ResponseEntity<?> crearTarea(@RequestBody Tarea tarea, Authentication authentication) {
        Usuario usuario = obtenerUsuarioAutenticado(authentication);
        if (usuario == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Sesión inválida"));
        }

        String error = validarContenidoTarea(tarea, true);
        if (error != null) {
            return ResponseEntity.badRequest().body(Map.of("message", error));
        }

        if (!jornadaService.tieneJornadaActiva(usuario.getId())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "Debes registrar Check In antes de crear una tarea"));
        }

        tarea.setNombre(tarea.getNombre().trim());
        tarea.setDescripcion(limpiarOpcional(tarea.getDescripcion()));
        tarea.setTipo(limpiarOpcional(tarea.getTipo()));
        tarea.setMeta(limpiarOpcional(tarea.getMeta()));
        tarea.setBitacora(limpiarOpcional(tarea.getBitacora()));

        // El codigo lo define el servidor. Evita colisiones de 3 digitos y codigos arbitrarios.
        tarea.setCodigo("NODE-" + UUID.randomUUID().toString().replace("-", "").substring(0, 16).toUpperCase());

        if (!esAdmin(usuario)) {
            tarea.setAsignadoA(usuario.getNombre());
        } else if (tarea.getAsignadoA() == null || tarea.getAsignadoA().isBlank()) {
            tarea.setAsignadoA(usuario.getNombre());
        } else {
            tarea.setAsignadoA(tarea.getAsignadoA().trim());
        }

        tarea.setEstado("En Progreso");
        tarea.setFecha(LocalDate.now().toString());

        if (tarea.getFechaInicio() == null || tarea.getFechaInicio().isBlank()) {
            tarea.setFechaInicio(LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm")));
        } else if (!horaValida(tarea.getFechaInicio())) {
            return ResponseEntity.badRequest().body(Map.of("message", "La hora de inicio no es válida"));
        }

        String fechaLimite = normalizarFechaLimite(tarea.getFechaLimite(), tarea.getFecha());
        if (fechaLimite == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "La fecha límite debe incluir una fecha y hora válidas"));
        }
        tarea.setFechaLimite(fechaLimite);

        // Solo el endpoint administrativo de posición puede modificar el mapa.
        tarea.setPosicionX(null);
        tarea.setPosicionY(null);

        Tarea guardada = tareaRepository.save(tarea);
        return ResponseEntity.status(HttpStatus.CREATED).body(guardada);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizarTarea(
            @PathVariable Long id,
            @RequestBody Tarea tareaDetalles,
            Authentication authentication) {

        Usuario usuario = obtenerUsuarioAutenticado(authentication);
        if (usuario == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Sesión inválida"));
        }

        Optional<Tarea> tareaOpt = tareaRepository.findById(id);
        if (tareaOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Tarea tarea = tareaOpt.get();
        boolean admin = esAdmin(usuario);
        boolean propietario = esPropietario(usuario, tarea);

        if ("Finalizada".equalsIgnoreCase(tarea.getEstado())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "La tarea finalizada está bloqueada"));
        }
        if (!admin && !propietario) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Solo el responsable de la tarea puede modificarla"));
        }

        String error = validarContenidoTarea(tareaDetalles, false);
        if (error != null) {
            return ResponseEntity.badRequest().body(Map.of("message", error));
        }

        String nuevoEstado = tareaDetalles.getEstado();
        if (nuevoEstado != null && !nuevoEstado.isBlank() && !estadoValido(nuevoEstado)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Cambio de estado no permitido"));
        }

        if (!admin) {
            if ("En Revisión".equalsIgnoreCase(tarea.getEstado())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("message", "La tarea está en revisión y no puede editarse"));
            }
            if ("Finalizada".equalsIgnoreCase(nuevoEstado)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("message", "Solo un administrador puede aprobar y finalizar tareas"));
            }
        }

        tarea.setNombre(tareaDetalles.getNombre().trim());
        tarea.setDescripcion(limpiarOpcional(tareaDetalles.getDescripcion()));
        tarea.setEstado(nuevoEstado == null || nuevoEstado.isBlank() ? tarea.getEstado() : normalizarEstado(nuevoEstado));
        tarea.setMeta(limpiarOpcional(tareaDetalles.getMeta()));
        tarea.setMetaCumplida(Boolean.TRUE.equals(tareaDetalles.getMetaCumplida()));
        tarea.setBitacora(limpiarOpcional(tareaDetalles.getBitacora()));
        tarea.setEvidencia(limpiarOpcional(tareaDetalles.getEvidencia()));
        if (admin && tareaDetalles.getFechaFin() != null) {
            tarea.setFechaFin(tareaDetalles.getFechaFin().trim());
        }

        Tarea actualizada = tareaRepository.save(tarea);
        return ResponseEntity.ok(actualizada);
    }

    @PatchMapping("/{id}/posicion")
    public ResponseEntity<?> actualizarPosicionMapa(
            @PathVariable Long id,
            @RequestBody Map<String, Double> posicion,
            Authentication authentication) {

        Usuario usuario = obtenerUsuarioAutenticado(authentication);
        if (usuario == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Sesión inválida"));
        }
        if (!esAdmin(usuario)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Solo un administrador puede cambiar la posición de las tareas"));
        }

        Double posicionX = posicion.get("posicionX");
        Double posicionY = posicion.get("posicionY");
        if (posicionX == null || posicionY == null
                || !Double.isFinite(posicionX) || !Double.isFinite(posicionY)) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "La posición de la tarea no es válida"));
        }

        Optional<Tarea> tareaOpt = tareaRepository.findById(id);
        if (tareaOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Tarea tarea = tareaOpt.get();
        tarea.setPosicionX(posicionX);
        tarea.setPosicionY(posicionY);
        return ResponseEntity.ok(tareaRepository.save(tarea));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminarTarea(@PathVariable Long id, Authentication authentication) {
        Usuario usuario = obtenerUsuarioAutenticado(authentication);
        if (usuario == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Sesión inválida"));
        }

        Optional<Tarea> tareaOpt = tareaRepository.findById(id);
        if (tareaOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Tarea tarea = tareaOpt.get();
        if ("Finalizada".equalsIgnoreCase(tarea.getEstado())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "La tarea finalizada está bloqueada y no puede eliminarse"));
        }
        if (!esAdmin(usuario) && !esPropietario(usuario, tarea)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "No tienes permiso para eliminar esta tarea"));
        }

        tareaRepository.delete(tarea);
        return ResponseEntity.noContent().build();
    }

    private String validarContenidoTarea(Tarea tarea, boolean creacion) {
        if (tarea == null || tarea.getNombre() == null || tarea.getNombre().isBlank()) {
            return "El nombre de la tarea es obligatorio";
        }
        String error = InputSecurity.validarLongitud(tarea.getNombre().trim(), MAX_NOMBRE, "El nombre de la tarea");
        if (error != null) return error;
        error = InputSecurity.validarLongitud(tarea.getDescripcion(), MAX_DESCRIPCION, "La descripción");
        if (error != null) return error;
        error = InputSecurity.validarLongitud(tarea.getTipo(), MAX_TIPO, "El tipo de tarea");
        if (error != null) return error;
        error = InputSecurity.validarLongitud(tarea.getAsignadoA(), MAX_ASIGNADO, "El responsable");
        if (error != null) return error;
        error = InputSecurity.validarLongitud(tarea.getMeta(), MAX_META, "La meta");
        if (error != null) return error;
        error = InputSecurity.validarLongitud(tarea.getBitacora(), MAX_BITACORA, "La bitácora");
        if (error != null) return error;
        error = InputSecurity.validarEvidenciaImagen(tarea.getEvidencia());
        if (error != null) return error;

        if (!creacion && tarea.getFechaFin() != null && tarea.getFechaFin().length() > 50) {
            return "La fecha de cierre no es válida";
        }
        return null;
    }

    private String normalizarFechaLimite(String valor, String fechaTarea) {
        String candidato = valor == null || valor.isBlank() ? fechaTarea + "T18:00" : valor.trim();
        if (candidato.matches("\\d{2}:\\d{2}")) {
            candidato = fechaTarea + "T" + candidato;
        }
        try {
            LocalDateTime.parse(candidato, DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm"));
            return candidato;
        } catch (DateTimeParseException ex) {
            return null;
        }
    }

    private boolean horaValida(String valor) {
        try {
            LocalTime.parse(valor.trim(), DateTimeFormatter.ofPattern("HH:mm"));
            return true;
        } catch (DateTimeParseException ex) {
            return false;
        }
    }

    private boolean estadoValido(String estado) {
        return "En Progreso".equalsIgnoreCase(estado)
                || "En Revisión".equalsIgnoreCase(estado)
                || "Finalizada".equalsIgnoreCase(estado);
    }

    private String normalizarEstado(String estado) {
        if ("En Revisión".equalsIgnoreCase(estado)) return "En Revisión";
        if ("Finalizada".equalsIgnoreCase(estado)) return "Finalizada";
        return "En Progreso";
    }

    private String limpiarOpcional(String valor) {
        if (valor == null) return null;
        String limpio = valor.trim();
        return limpio.isEmpty() ? null : limpio;
    }

    private Usuario obtenerUsuarioAutenticado(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return null;
        }
        return usuarioRepository.findByEmail(authentication.getName()).orElse(null);
    }

    private boolean esAdmin(Usuario usuario) {
        return usuario != null && "admin".equalsIgnoreCase(usuario.getRol());
    }

    private boolean esPropietario(Usuario usuario, Tarea tarea) {
        return usuario != null
                && usuario.getNombre() != null
                && tarea.getAsignadoA() != null
                && usuario.getNombre().equalsIgnoreCase(tarea.getAsignadoA());
    }
}
