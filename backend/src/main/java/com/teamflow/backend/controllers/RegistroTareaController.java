package com.teamflow.backend.controllers;
import com.teamflow.backend.models.*;
import com.teamflow.backend.repositories.*;
import com.teamflow.backend.security.TaskAccessRules;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController @RequestMapping("/api/tareas/{id}/registros")
public class RegistroTareaController {
    private final TareaRepository tareas;
    private final UsuarioRepository usuarios;
    private final RegistroTareaRepository registros;
    public RegistroTareaController(TareaRepository tareas,UsuarioRepository usuarios,RegistroTareaRepository registros) {
        this.tareas=tareas;this.usuarios=usuarios;this.registros=registros;
    }
    private Usuario usuario(Authentication auth) {return auth==null?null:usuarios.findByEmail(auth.getName()).orElse(null);}
    @GetMapping
    public ResponseEntity<?> listar(@PathVariable Long id,@RequestParam(defaultValue="NOTA") String tipo,
            @RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size,Authentication auth) {
        var u=usuario(auth);if(u==null)return ResponseEntity.status(401).build();
        var t=tareas.findById(id).orElse(null);
        if(t==null||!t.isActivo())return ResponseEntity.notFound().build();
        if(!TaskAccessRules.puedeLeer(u,t,usuarios))return ResponseEntity.status(403).build();
        if(page<0||page>100000||size<1||size>100||!("NOTA".equals(tipo)||"RECHAZO".equals(tipo)))return ResponseEntity.badRequest().build();
        var result=registros.findByTareaIdAndTipoInOrderByCreadoEnMsAscIdAsc(id,"NOTA".equals(tipo)?java.util.List.of("NOTA","LEGADO"):java.util.List.of(tipo),PageRequest.of(page,size));
        return ResponseEntity.ok(Map.of("content",result.getContent(),"page",page,"size",size,"totalElements",result.getTotalElements(),"totalPages",result.getTotalPages()));
    }
    public record NuevaNota(String contenido) {}
    @PostMapping @Transactional
    public ResponseEntity<?> agregar(@PathVariable Long id,@RequestBody NuevaNota nota,Authentication auth) {
        var u=usuario(auth);if(u==null)return ResponseEntity.status(401).build();
        // Serializa con revisión, finalización y bajas. Nunca reemplaza otra nota.
        var t=tareas.findByIdForUpdate(id).orElse(null);
        if(t==null||!t.isActivo())return ResponseEntity.notFound().build();
        if(!TaskAccessRules.puedeLeer(u,t,usuarios))return ResponseEntity.status(403).build();
        if(!"En Progreso".equals(t.getEstado()))return ResponseEntity.status(403).body(Map.of("message","Solo puedes agregar notas mientras la tarea está en progreso"));
        if(nota==null||nota.contenido()==null||nota.contenido().isBlank()||nota.contenido().trim().length()>10000)
            return ResponseEntity.badRequest().body(Map.of("message","La nota debe contener entre 1 y 10000 caracteres"));
        return ResponseEntity.status(201).body(registros.save(RegistroTarea.nuevo(t,u,"NOTA",nota.contenido())));
    }
}
