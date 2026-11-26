package com.teamflow.backend.controllers;

import com.teamflow.backend.models.Tarea;
import com.teamflow.backend.models.Usuario;
import com.teamflow.backend.repositories.TareaRepository;
import com.teamflow.backend.repositories.UsuarioRepository;
import com.teamflow.backend.security.InputSecurity;
import com.teamflow.backend.security.TaskAccessRules;
import com.teamflow.backend.services.JornadaService;
import com.teamflow.backend.services.DependenciaTareaRules;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Isolation;
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
    private final com.teamflow.backend.repositories.RegistroTareaRepository registros;

    public TareaController(TareaRepository tareaRepository, UsuarioRepository usuarioRepository, JornadaService jornadaService, com.teamflow.backend.repositories.RegistroTareaRepository registros) {
        this.tareaRepository = tareaRepository;
        this.usuarioRepository = usuarioRepository;
        this.jornadaService = jornadaService;
        this.registros = registros;
    }

    @GetMapping
    public ResponseEntity<?> listarTareas(Authentication authentication) {
        Usuario usuario = obtenerUsuarioAutenticado(authentication);
        if (usuario == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        List<Tarea> activas = tareaRepository.findByActivoTrue();
        if (esAdmin(usuario)) return ResponseEntity.ok(activas);
        // Mantener nodos y conexiones del mapa compartido sin exponer
        // bitacoras, descripciones privadas o evidencias de otras cuentas.
        return ResponseEntity.ok(activas.stream()
                .map(tarea -> esPropietario(usuario, tarea) ? tarea : vistaMapa(tarea)).toList());
    }

    @PostMapping
    @Transactional(isolation = Isolation.READ_COMMITTED) // Guarda la tarea y sus relaciones de forma atómica.
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

        // Las peticiones concurrentes usan una misma fila de bloqueo hasta
        // el COMMIT. READ_COMMITTED obliga a releer las relaciones confirmadas.
        tareaRepository.bloquearRedDependencias();
        String errorDependencia = DependenciaTareaRules.validar(null, tarea.getDependenciaIds(), tareaRepository::findById);
        if (errorDependencia != null) return ResponseEntity.badRequest().body(Map.of("message", errorDependencia));

        if (!jornadaService.tieneJornadaActiva(usuario.getId())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "Debes registrar Check In antes de crear una tarea"));
        }

        tarea.setActivo(true);
        tarea.setId(null);
        tarea.setVersion(null);
        tarea.setFinalizadaEnMs(null);
        tarea.setNombre(tarea.getNombre().trim());
        tarea.setDescripcion(limpiarOpcional(tarea.getDescripcion()));
        tarea.setTipo(limpiarOpcional(tarea.getTipo()));
        tarea.setMeta(limpiarOpcional(tarea.getMeta()));
        tarea.setBitacora(limpiarOpcional(tarea.getBitacora()));

        // El codigo lo define el servidor. Evita colisiones de 3 digitos y codigos arbitrarios.
        tarea.setCodigo("NODE-" + UUID.randomUUID().toString().replace("-", "").substring(0, 16).toUpperCase());

        if (!esAdmin(usuario) || tarea.getAsignadoA() == null || tarea.getAsignadoA().isBlank()) {
            tarea.setAsignadoA(usuario.getNombre());
            tarea.setAsignadoUsuarioId(usuario.getId());
        } else {
            String nombre = tarea.getAsignadoA().trim();
            List<Usuario> coincidencias = usuarioRepository.findAllByNombreIgnoreCase(nombre).stream()
                    .filter(u -> !"inactivo".equalsIgnoreCase(u.getEstado()))
                    .toList();
            if (coincidencias.size() != 1) {
                return ResponseEntity.badRequest().body(Map.of("message", "Selecciona un responsable activo y sin nombres duplicados"));
            }
            tarea.setAsignadoA(coincidencias.get(0).getNombre());
            tarea.setAsignadoUsuarioId(coincidencias.get(0).getId());
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

        com.teamflow.backend.services.TaskClockRules.iniciar(tarea, System.currentTimeMillis());
        Tarea guardada = tareaRepository.save(tarea);
        if (guardada != null && guardada.getBitacora() != null && !guardada.getBitacora().isBlank())
            registros.save(com.teamflow.backend.models.RegistroTarea.nuevo(guardada, usuario, "NOTA", guardada.getBitacora()));
        return ResponseEntity.status(HttpStatus.CREATED).body(guardada);
    }

    @PutMapping("/{id}")
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public ResponseEntity<?> actualizarTarea(
            @PathVariable Long id,
            @RequestBody Tarea tareaDetalles,
            Authentication authentication) {

        Usuario usuario = obtenerUsuarioAutenticado(authentication);
        if (usuario == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Sesión inválida"));
        }

        tareaRepository.bloquearRedDependencias();
        Optional<Tarea> tareaOpt = tareaRepository.findByIdForUpdate(id);
        if (tareaOpt.isEmpty() || !tareaOpt.get().isActivo()) {
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

        if (tareaDetalles.getVersion() == null && tarea.getVersion() != null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Falta la versión de la tarea. Actualiza los datos."));
        }
        if (!java.util.Objects.equals(tarea.getVersion(), tareaDetalles.getVersion())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message",
                    "Otra sesión modificó la tarea. Conserva tu borrador y revisa la versión reciente antes de guardar."));
        }
        String error = validarContenidoTarea(tareaDetalles, false);
        if (error != null) {
            return ResponseEntity.badRequest().body(Map.of("message", error));
        }

        // Una relación histórica con una tarea desactivada se puede conservar
        // mientras se edita otro campo. Solo se validan enlaces nuevos/cambiados.
        List<Long> anteriores = tarea.getDependenciaIds();
        List<Long> solicitadas = tareaDetalles.getDependenciaIds();
        boolean mismasDependencias = anteriores.size() == solicitadas.size()
                && new java.util.HashSet<>(anteriores).equals(new java.util.HashSet<>(solicitadas));
        String errorDependencia = mismasDependencias ? null
                : DependenciaTareaRules.validar(id, solicitadas, tareaRepository::findById);
        if (errorDependencia != null) return ResponseEntity.badRequest().body(Map.of("message", errorDependencia));

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

        boolean rechazo = "En Revisión".equalsIgnoreCase(tarea.getEstado())
                && "En Progreso".equalsIgnoreCase(nuevoEstado);
        if (rechazo) {
            String motivo = tareaDetalles.getMotivoRechazo();
            if (motivo == null || motivo.isBlank() || motivo.trim().length() > 3000)
                return ResponseEntity.badRequest().body(Map.of("message", "Debes indicar un motivo de rechazo de entre 1 y 3000 caracteres"));
            registros.save(com.teamflow.backend.models.RegistroTarea.nuevo(tarea, usuario, "RECHAZO", motivo));
        }
        // Compatibilidad con clientes antiguos: conservar también el texto sustituido.
        if (!java.util.Objects.equals(tarea.getBitacora(), limpiarOpcional(tareaDetalles.getBitacora()))) {
            if (tarea.getBitacora() != null && !tarea.getBitacora().isBlank())
                registros.save(com.teamflow.backend.models.RegistroTarea.legado(tarea));
            if (tareaDetalles.getBitacora() != null && !tareaDetalles.getBitacora().isBlank())
                registros.save(com.teamflow.backend.models.RegistroTarea.nuevo(tarea, usuario, "NOTA", tareaDetalles.getBitacora()));
        }
        String estadoDestino = nuevoEstado == null || nuevoEstado.isBlank() ? tarea.getEstado() : normalizarEstado(nuevoEstado);
        com.teamflow.backend.services.TaskClockRules.transicionar(tarea, estadoDestino, tarea.isActivo(), System.currentTimeMillis());
        tarea.setNombre(tareaDetalles.getNombre().trim());
        tarea.setDescripcion(limpiarOpcional(tareaDetalles.getDescripcion()));
        tarea.setEstado(estadoDestino);
        tarea.setMeta(limpiarOpcional(tareaDetalles.getMeta()));
        tarea.setMetaCumplida(Boolean.TRUE.equals(tareaDetalles.getMetaCumplida()));
        tarea.setBitacora(limpiarOpcional(tareaDetalles.getBitacora()));
        tarea.setEvidencia(limpiarOpcional(tareaDetalles.getEvidencia()));
        tarea.setDependenciaIds(tareaDetalles.getDependenciaIds());
        if (admin && tareaDetalles.getFechaFin() != null) {
            tarea.setFechaFin(tareaDetalles.getFechaFin().trim());
        }
        if ("Finalizada".equals(tarea.getEstado())) {
            tarea.setFinalizadaEnMs(System.currentTimeMillis());
            tarea.setFechaFin(LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm")));
        }

        Tarea actualizada = tareaRepository.save(tarea);
        return ResponseEntity.ok(actualizada);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> detalleTarea(@PathVariable Long id, Authentication authentication) {
        Usuario usuario = obtenerUsuarioAutenticado(authentication);
        if (usuario == null) return ResponseEntity.status(401).build();
        Tarea tarea = tareaRepository.findById(id).orElse(null);
        if (tarea == null || !tarea.isActivo()) return ResponseEntity.notFound().build();
        if (!TaskAccessRules.puedeLeer(usuario, tarea, usuarioRepository)) return ResponseEntity.status(403).build();
        return ResponseEntity.ok(tarea);
    }

    // Guardado conjunto: valida TODAS las propuestas antes de guardar la primera.
    // El bloqueo por fila y la comparación con la posición original evitan que
    // una vista previa antigua sobrescriba cambios realizados por otro admin.
    public record PosicionPropuesta(Long id, Double posicionX, Double posicionY,
                                   Double anteriorX, Double anteriorY) { }

    @PatchMapping("/posiciones")
    @Transactional
    public ResponseEntity<?> actualizarPosicionesMapa(
            @RequestBody List<PosicionPropuesta> propuestas,
            Authentication authentication) {
        Usuario usuario = obtenerUsuarioAutenticado(authentication);
        if (usuario == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "Sesión inválida"));
        if (!esAdmin(usuario)) return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("message", "Solo un administrador puede autoorganizar las tareas"));

        if (propuestas == null || propuestas.isEmpty() || propuestas.size() > 1000) {
            return ResponseEntity.badRequest().body(Map.of("message", "La lista debe incluir entre 1 y 1000 tareas"));
        }
        Map<Long, PosicionPropuesta> porId = new java.util.TreeMap<>();
        for (PosicionPropuesta propuesta : propuestas) {
            if (propuesta == null || propuesta.id() == null
                    || propuesta.posicionX() == null || propuesta.posicionY() == null
                    || !Double.isFinite(propuesta.posicionX()) || !Double.isFinite(propuesta.posicionY())
                    || Math.abs(propuesta.posicionX()) > 10_000_000
                    || Math.abs(propuesta.posicionY()) > 10_000_000
                    || (propuesta.anteriorX() != null && !Double.isFinite(propuesta.anteriorX()))
                    || (propuesta.anteriorY() != null && !Double.isFinite(propuesta.anteriorY()))) {
                return ResponseEntity.badRequest().body(Map.of("message", "Hay posiciones no válidas"));
            }
            if (porId.putIfAbsent(propuesta.id(), propuesta) != null) {
                return ResponseEntity.badRequest().body(Map.of("message", "No se permiten tareas duplicadas"));
            }
        }

        List<Tarea> tareas = new java.util.ArrayList<>();
        for (Map.Entry<Long, PosicionPropuesta> entry : porId.entrySet()) {
            Tarea tarea = tareaRepository.findByIdForUpdate(entry.getKey()).orElse(null);
            if (tarea == null || !tarea.isActivo()) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(Map.of("message", "Una tarea ya no está disponible. Actualiza el mapa."));
            }
            PosicionPropuesta p = entry.getValue();
            if (!java.util.Objects.equals(tarea.getPosicionX(), p.anteriorX())
                    || !java.util.Objects.equals(tarea.getPosicionY(), p.anteriorY())) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(Map.of("message", "Otra sesión movió una tarea. Actualiza el mapa antes de guardar."));
            }
            tareas.add(tarea);
        }
        for (Tarea tarea : tareas) {
            PosicionPropuesta p = porId.get(tarea.getId());
            tarea.setPosicionX(p.posicionX());
            tarea.setPosicionY(p.posicionY());
        }
        tareaRepository.saveAllAndFlush(tareas);
        List<Map<String, Object>> guardadas = tareas.stream().map(tarea -> Map.<String, Object>of(
                "id", tarea.getId(), "posicionX", tarea.getPosicionX(), "posicionY", tarea.getPosicionY(), "version", java.util.Objects.requireNonNullElse(tarea.getVersion(), 0L)))
                .toList();
        return ResponseEntity.ok(guardadas);
    }

    @PatchMapping("/{id}/posicion")
    @Transactional
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

        Double posicionX = posicion == null ? null : posicion.get("posicionX");
        Double posicionY = posicion == null ? null : posicion.get("posicionY");
        if (posicionX == null || posicionY == null
                || !Double.isFinite(posicionX) || !Double.isFinite(posicionY)
                || Math.abs(posicionX) > 10_000_000 || Math.abs(posicionY) > 10_000_000) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "La posición de la tarea no es válida"));
        }

        Optional<Tarea> tareaOpt = tareaRepository.findByIdForUpdate(id);
        if (tareaOpt.isEmpty() || !tareaOpt.get().isActivo()) {
            return ResponseEntity.notFound().build();
        }

        Tarea tarea = tareaOpt.get();
        // null representa una posición aún no guardada, no un campo omitido.
        if (!posicion.containsKey("anteriorX") || !posicion.containsKey("anteriorY")) {
            return ResponseEntity.badRequest().body(Map.of("message", "Debes indicar la posición anterior. Actualiza el mapa."));
        }
        if (!java.util.Objects.equals(tarea.getPosicionX(), posicion.get("anteriorX"))
                || !java.util.Objects.equals(tarea.getPosicionY(), posicion.get("anteriorY"))) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "Otra sesión movió la tarea. Actualiza el mapa antes de guardar."));
        }
        tarea.setPosicionX(posicionX);
        tarea.setPosicionY(posicionY);
        return ResponseEntity.ok(tareaRepository.save(tarea));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> eliminarTarea(@PathVariable Long id, Authentication authentication, @RequestParam(required=false) Long version) {
        Usuario usuario = obtenerUsuarioAutenticado(authentication);
        if (usuario == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Sesión inválida"));
        }

        Optional<Tarea> tareaOpt = tareaRepository.findByIdForUpdate(id);
        if (tareaOpt.isEmpty() || !tareaOpt.get().isActivo()) {
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

        if (version != null && !java.util.Objects.equals(version,tarea.getVersion()))
            return ResponseEntity.status(409).body(Map.of("message","Otra sesión modificó la tarea. Conserva tu borrador y revisa la versión reciente antes de confirmar la baja."));
        // Conservamos la tarea, sus archivos y sus relaciones originales.
        // Solo desaparece de las vistas normales. Si se reactiva, recupera su historial.
        com.teamflow.backend.services.TaskClockRules.transicionar(tarea, tarea.getEstado(), false, System.currentTimeMillis());
        tarea.setActivo(false);
        tareaRepository.save(tarea);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/reactivar")
    @Transactional
    public ResponseEntity<?> reactivarTarea(@PathVariable Long id, Authentication authentication) {
        Usuario usuario = obtenerUsuarioAutenticado(authentication);
        if (usuario == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        if (!esAdmin(usuario)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        Tarea tarea = tareaRepository.findByIdForUpdate(id).orElse(null);
        if (tarea == null || tarea.isActivo()) return ResponseEntity.notFound().build();
        com.teamflow.backend.services.TaskClockRules.transicionar(tarea, tarea.getEstado(), true, System.currentTimeMillis());
        tarea.setActivo(true);
        return ResponseEntity.ok(tareaRepository.save(tarea));
    }

    private Tarea vistaMapa(Tarea original) {
        Tarea resumen = new Tarea();
        resumen.setId(original.getId());
        resumen.setVersion(original.getVersion());
        resumen.setCodigo(original.getCodigo());
        resumen.setNombre(original.getNombre());
        resumen.setTipo(original.getTipo());
        resumen.setAsignadoA(original.getAsignadoA());
        resumen.setAsignadoUsuarioId(original.getAsignadoUsuarioId());
        resumen.setEstado(original.getEstado());
        resumen.setFecha(original.getFecha());
        resumen.setFechaInicio(original.getFechaInicio());
        resumen.setFechaFin(original.getFechaFin());
        resumen.setFechaLimite(original.getFechaLimite());
        resumen.setPosicionX(original.getPosicionX());
        resumen.setPosicionY(original.getPosicionY());
        resumen.setDependenciaIds(original.getDependenciaIds());
        resumen.setMetaCumplida(original.getMetaCumplida());
        return resumen;
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
        if (creacion && (tarea.getMeta() == null || tarea.getMeta().isBlank())) return "La meta de la tarea es obligatoria";
        if (creacion && (tarea.getFechaLimite() == null || tarea.getFechaLimite().isBlank())) return "La hora límite de la tarea es obligatoria";

        if (!creacion && tarea.getFechaFin() != null && tarea.getFechaFin().length() > 50) {
            return "La fecha de cierre no es válida";
        }
        return null;
    }

    private String normalizarFechaLimite(String valor, String fechaTarea) {
        if (valor == null || valor.isBlank()) return null;
        String candidato = valor.trim();
        if (candidato.matches("\\d{2}:\\d{2}")) {
            candidato = fechaTarea + "T" + candidato;
        }
        try {
            if (!candidato.matches("\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}")) return null;
            LocalDateTime.parse(candidato, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
            return candidato;
        } catch (DateTimeParseException ex) {
            return null;
        }
    }

    private boolean horaValida(String valor) {
        try {
            if (!valor.trim().matches("\\d{2}:\\d{2}")) return false;
            LocalTime.parse(valor.trim(), DateTimeFormatter.ISO_LOCAL_TIME);
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
        return TaskAccessRules.responsable(usuario, tarea, usuarioRepository);
    }
}
