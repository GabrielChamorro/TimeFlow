package com.teamflow.backend.controllers;

import com.teamflow.backend.models.TipoTarea;
import com.teamflow.backend.repositories.TipoTareaRepository;
import com.teamflow.backend.security.InputSecurity;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/tipos-tarea")
public class TipoTareaController {

    private static final int MAX_NOMBRE = 100;
    private static final int MAX_DESCRIPCION = 2000;

    private final TipoTareaRepository tipoTareaRepository;

    public TipoTareaController(TipoTareaRepository tipoTareaRepository) {
        this.tipoTareaRepository = tipoTareaRepository;
    }

    @GetMapping
    public List<TipoTarea> obtenerTodos() {
        return tipoTareaRepository.findByActivoTrue();
    }

    // La vista administrativa necesita mostrar las plantillas desactivadas.
    @GetMapping("/administracion")
    public ResponseEntity<?> listarAdministracion(org.springframework.security.core.Authentication autenticacion) {
        boolean esAdmin = autenticacion != null && autenticacion.getAuthorities() != null
                && autenticacion.getAuthorities().stream()
                    .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
        if (!esAdmin) return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("message", "No tienes permisos para consultar esta lista"));
        return ResponseEntity.ok(tipoTareaRepository.findAll());
    }

    @PostMapping
    public ResponseEntity<?> crear(@RequestBody TipoTarea tipoTarea) {
        String error = validar(tipoTarea);
        if (error != null) {
            return ResponseEntity.badRequest().body(Map.of("message", error));
        }

        String nombre = tipoTarea.getNombre().trim();
        if (tipoTareaRepository.findByNombreIgnoreCase(nombre).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "Ya existe un tipo de tarea con ese nombre"));
        }

        tipoTarea.setId(null);
        tipoTarea.setVersion(null);
        tipoTarea.setActivo(true);
        tipoTarea.setNombre(nombre);
        tipoTarea.setDescripcion(limpiar(tipoTarea.getDescripcion()));
        return ResponseEntity.status(HttpStatus.CREATED).body(tipoTareaRepository.save(tipoTarea));
    }

    @org.springframework.transaction.annotation.Transactional(isolation=org.springframework.transaction.annotation.Isolation.READ_COMMITTED)
    @PutMapping("/{id}")
    public ResponseEntity<?> actualizar(@PathVariable Long id, @RequestBody TipoTarea datos) {
        String error = validar(datos);
        if (error != null) {
            return ResponseEntity.badRequest().body(Map.of("message", error));
        }

        TipoTarea actual=tipoTareaRepository.findByIdForUpdate(id).orElse(null);
        if (actual==null) return ResponseEntity.notFound().build();
        if (!actual.isActivo() || !java.util.Objects.equals(actual.getVersion(),datos.getVersion())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", "Otra sesión modificó o desactivó la plantilla. Tu borrador se conserva; revisa los valores actuales."));
        }
        String nombre = datos.getNombre().trim();
        Optional<TipoTarea> repetido = tipoTareaRepository.findByNombreIgnoreCase(nombre);
        if (repetido.isPresent() && !repetido.get().getId().equals(id)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "Ya existe un tipo de tarea con ese nombre"));
        }

        actual.setNombre(nombre);
        actual.setDescripcion(limpiar(datos.getDescripcion()));
        return ResponseEntity.ok(tipoTareaRepository.save(actual));
    }

    @org.springframework.transaction.annotation.Transactional(isolation=org.springframework.transaction.annotation.Isolation.READ_COMMITTED)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminar(@PathVariable Long id, @RequestParam(required=false) Long version) {
        TipoTarea tipo = tipoTareaRepository.findByIdForUpdate(id).orElse(null);
        if (tipo == null || !tipo.isActivo()) return ResponseEntity.notFound().build();
        if (version != null && !java.util.Objects.equals(version,tipo.getVersion()))
            return ResponseEntity.status(409).body(Map.of("message","Otra sesión modificó la plantilla. Actualiza el catálogo y vuelve a revisar la confirmación."));
        tipo.setActivo(false);
        tipoTareaRepository.save(tipo);
        return ResponseEntity.noContent().build();
    }

    @org.springframework.transaction.annotation.Transactional(isolation=org.springframework.transaction.annotation.Isolation.READ_COMMITTED)
    @PatchMapping("/{id}/reactivar")
    public ResponseEntity<?> reactivar(@PathVariable Long id) {
        TipoTarea tipo = tipoTareaRepository.findByIdForUpdate(id).orElse(null);
        if (tipo == null || tipo.isActivo()) return ResponseEntity.notFound().build();
        tipo.setActivo(true);
        return ResponseEntity.ok(tipoTareaRepository.save(tipo));
    }

    @ExceptionHandler(org.springframework.dao.DataIntegrityViolationException.class)
    public ResponseEntity<?> conflictoDeDatos() {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("message", "No se pudo guardar: el nombre ya existe o hay una restricción de base de datos"));
    }

    private String validar(TipoTarea tipoTarea) {
        if (tipoTarea == null || tipoTarea.getNombre() == null || tipoTarea.getNombre().isBlank()) {
            return "El nombre del tipo de tarea es obligatorio";
        }
        String error = InputSecurity.validarLongitud(tipoTarea.getNombre().trim(), MAX_NOMBRE, "El nombre del tipo de tarea");
        if (error != null) return error;
        return InputSecurity.validarLongitud(tipoTarea.getDescripcion(), MAX_DESCRIPCION, "La descripción");
    }

    private String limpiar(String valor) {
        if (valor == null) return null;
        String limpio = valor.trim();
        return limpio.isBlank() ? null : limpio;
    }
}
