package com.teamflow.backend.controllers;

import com.teamflow.backend.dto.EvidenciaResumen;
import com.teamflow.backend.models.EvidenciaTarea;
import com.teamflow.backend.models.Tarea;
import com.teamflow.backend.models.Usuario;
import com.teamflow.backend.repositories.EvidenciaTareaRepository;
import com.teamflow.backend.repositories.TareaRepository;
import com.teamflow.backend.repositories.UsuarioRepository;
import com.teamflow.backend.security.EvidenciaArchivoRules;
import com.teamflow.backend.security.TaskAccessRules;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.*;
import org.springframework.transaction.annotation.Transactional;

@RestController
@RequestMapping("/api/tareas/{tareaId}/evidencias")
public class EvidenciaTareaController {
    private final EvidenciaTareaRepository evidencias;
    private final TareaRepository tareas;
    private final UsuarioRepository usuarios;
    public EvidenciaTareaController(EvidenciaTareaRepository evidencias, TareaRepository tareas, UsuarioRepository usuarios) {
        this.evidencias=evidencias;
        this.tareas=tareas;
        this.usuarios=usuarios;
    }
    private Usuario usuario(Authentication auth) {
        return auth == null ? null : usuarios.findByEmail(auth.getName()).orElse(null);
    }
    // Solo las tareas activas En Progreso permiten modificar evidencias.
    // Una tarea con un estado inesperado debe quedar bloqueada por defecto.
    private boolean puedeEditar(Usuario u, Tarea t) {
        return u != null && t != null && t.isActivo()
          && "En Progreso".equalsIgnoreCase(t.getEstado())
          && TaskAccessRules.puedeLeer(u,t,usuarios);
    }
    @GetMapping
    public ResponseEntity<?> lista(@PathVariable Long tareaId, Authentication auth) {
        if (usuario(auth)==null) return ResponseEntity.status(401).build();
        Tarea tarea = tareas.findById(tareaId).filter(Tarea::isActivo).orElse(null);
        if (tarea == null) return ResponseEntity.notFound().build();
        if (!TaskAccessRules.puedeLeer(usuario(auth), tarea, usuarios)) return ResponseEntity.status(403).build();
        return ResponseEntity.ok(evidencias.resumirPorTarea(tareaId));
    }
    @PostMapping(consumes=MediaType.MULTIPART_FORM_DATA_VALUE)
    @Transactional(isolation = org.springframework.transaction.annotation.Isolation.READ_COMMITTED)
    public ResponseEntity<?> subir(@PathVariable Long tareaId, @RequestPart("archivo") MultipartFile archivo, Authentication auth) {
        Usuario u=usuario(auth);
        if (u==null) return ResponseEntity.status(401).build();
        // El bloqueo evita que cargas simultaneas superen los limites de una tarea.
        Tarea t=tareas.findByIdForUpdate(tareaId).orElse(null);
        if (t==null || !t.isActivo()) return ResponseEntity.notFound().build();
        if (!puedeEditar(u,t)) return ResponseEntity.status(403).body(Map.of("message", "No puedes adjuntar archivos a esta tarea"));
        if (archivo==null || archivo.isEmpty() || !EvidenciaArchivoRules.tamanoValido(archivo.getSize()))
            return ResponseEntity.badRequest().body(Map.of("message", "El archivo debe tener como máximo 60 MB"));
        try {
            // Incluye archivos desactivados: la desactivacion nunca libera espacio en MySQL.
            if (evidencias.countByTareaId(tareaId) >= 25)
                return ResponseEntity.badRequest().body(Map.of("message", "La tarea ya tiene 25 archivos conservados"));
            long usados = evidencias.bytesTotalesPorTarea(tareaId);
            if (usados > EvidenciaArchivoRules.MAX_BYTES_POR_TAREA - archivo.getSize())
                return ResponseEntity.badRequest().body(Map.of("message", "La tarea alcanzó el límite de 300 MB de evidencias conservadas"));
            byte[] bytes=archivo.getBytes();
            String nombre=archivo.getOriginalFilename();
            String mime=EvidenciaArchivoRules.tipoPermitido(nombre,bytes);
            if (mime==null) return ResponseEntity.badRequest().body(Map.of("message", "Formato no permitido o contenido del archivo inválido"));
            EvidenciaTarea e=new EvidenciaTarea();
            e.setTareaId(tareaId);
            e.setActivo(true);
            e.setNombreOriginal(nombre);
            e.setTipoMime(mime);
            e.setTamanoBytes((long)bytes.length);
            e.setContenido(bytes);
            EvidenciaTarea saved=evidencias.save(e);
            return ResponseEntity.status(HttpStatus.CREATED).body(new EvidenciaResumen(saved.getId(),saved.getNombreOriginal(),saved.getTipoMime(),saved.getTamanoBytes(),saved.getFechaSubida()));
        } catch(IOException ex) {
            return ResponseEntity.status(500).body(Map.of("message", "No se pudo leer el archivo"));
        }
    }
    @GetMapping("/{id}")
    public ResponseEntity<?> descargar(@PathVariable Long tareaId,@PathVariable Long id,Authentication auth) {
        if (usuario(auth)==null) return ResponseEntity.status(401).build();
        Tarea tarea = tareas.findById(tareaId).filter(Tarea::isActivo).orElse(null);
        if (tarea == null) return ResponseEntity.notFound().build();
        if (!TaskAccessRules.puedeLeer(usuario(auth), tarea, usuarios)) return ResponseEntity.status(403).build();
        // No cargar un LONGBLOB de hasta 60 MiB para una solicitud sin permiso.
        EvidenciaTarea e=evidencias.findById(id).orElse(null);
        if (e==null || !e.isActivo() || !tareaId.equals(e.getTareaId())) return ResponseEntity.notFound().build();
        boolean preview=e.getTipoMime().startsWith("image/") || e.getTipoMime().startsWith("video/") || e.getTipoMime().equals("application/pdf");
        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(e.getTipoMime()))
            .header(HttpHeaders.CONTENT_DISPOSITION, (preview ? "inline" : "attachment") + "; filename=\"evidencia-" + id + "\"")
            .header("X-Content-Type-Options", "nosniff")
            .header(HttpHeaders.CACHE_CONTROL, "no-store")
            .body(e.getContenido());
    }
    @PatchMapping("/{id}/reactivar")
    public ResponseEntity<?> reactivar(@PathVariable Long tareaId,@PathVariable Long id,Authentication auth) {
        Usuario u = usuario(auth);
        if (u == null) return ResponseEntity.status(401).build();
        Tarea t = tareas.findById(tareaId).orElse(null);
        EvidenciaTarea e = evidencias.findById(id).orElse(null);
        if (t == null || !t.isActivo() || e == null || e.isActivo() || !tareaId.equals(e.getTareaId()))
            return ResponseEntity.notFound().build();
        if (!"admin".equalsIgnoreCase(u.getRol()) || !"En Progreso".equalsIgnoreCase(t.getEstado()))
            return ResponseEntity.status(403).build();
        e.setActivo(true);
        evidencias.save(e);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> eliminar(@PathVariable Long tareaId,@PathVariable Long id,Authentication auth,@RequestParam(required=false) Long version) {
        Usuario u=usuario(auth);
        if (u==null) return ResponseEntity.status(401).build();
        Tarea t=tareas.findByIdForUpdate(tareaId).orElse(null);
        EvidenciaTarea e=evidencias.findById(id).orElse(null);
        if (t==null || !t.isActivo() || e==null || !e.isActivo() || !tareaId.equals(e.getTareaId())) return ResponseEntity.notFound().build();
        if (!puedeEditar(u,t)) return ResponseEntity.status(403).build();
        if (version != null && !Objects.equals(version,t.getVersion()))
            return ResponseEntity.status(409).body(Map.of("message","Otra sesión modificó la tarea. Cierra el detalle y revisa su versión reciente antes de desactivar el archivo."));
        e.setActivo(false);
        evidencias.save(e);
        return ResponseEntity.noContent().build();
    }
}
