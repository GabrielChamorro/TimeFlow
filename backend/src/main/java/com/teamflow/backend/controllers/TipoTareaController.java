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
        return tipoTareaRepository.findAll();
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
        tipoTarea.setNombre(nombre);
        tipoTarea.setDescripcion(limpiar(tipoTarea.getDescripcion()));
        return ResponseEntity.status(HttpStatus.CREATED).body(tipoTareaRepository.save(tipoTarea));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizar(@PathVariable Long id, @RequestBody TipoTarea datos) {
        String error = validar(datos);
        if (error != null) {
            return ResponseEntity.badRequest().body(Map.of("message", error));
        }

        String nombre = datos.getNombre().trim();
        Optional<TipoTarea> repetido = tipoTareaRepository.findByNombreIgnoreCase(nombre);
        if (repetido.isPresent() && !repetido.get().getId().equals(id)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "Ya existe un tipo de tarea con ese nombre"));
        }

        return tipoTareaRepository.findById(id).map(tipo -> {
            tipo.setNombre(nombre);
            tipo.setDescripcion(limpiar(datos.getDescripcion()));
            return ResponseEntity.ok(tipoTareaRepository.save(tipo));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        if (tipoTareaRepository.existsById(id)) {
            tipoTareaRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
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
