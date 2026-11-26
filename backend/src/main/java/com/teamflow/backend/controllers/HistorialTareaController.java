package com.teamflow.backend.controllers;
import com.teamflow.backend.repositories.UsuarioRepository;
import com.teamflow.backend.services.HistorialTareaService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.time.*;
import java.time.format.DateTimeParseException;
import java.util.Map;

@RestController @RequestMapping("/api/tareas/historial")
public class HistorialTareaController {
    private final UsuarioRepository usuarios;private final HistorialTareaService historial;
    public HistorialTareaController(UsuarioRepository usuarios,HistorialTareaService historial){this.usuarios=usuarios;this.historial=historial;}
    @GetMapping
    public ResponseEntity<?> listar(@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size,
        @RequestParam(defaultValue="") String query,@RequestParam(required=false) String desde,@RequestParam(required=false) String hasta,Authentication auth) {
        var u=auth==null?null:usuarios.findByEmail(auth.getName()).orElse(null);
        if(u==null)return ResponseEntity.status(401).build();
        if(page<0||page>100000||size<1||size>100||query.length()>180)return ResponseEntity.badRequest().body(Map.of("message","Paginación o búsqueda inválida"));
        try {
            LocalDate from=desde==null||desde.isBlank()?null:LocalDate.parse(desde);
            LocalDate to=hasta==null||hasta.isBlank()?null:LocalDate.parse(hasta);
            if((from!=null&&(from.getYear()<1970||from.getYear()>9998))||(to!=null&&(to.getYear()<1970||to.getYear()>9998))||(from!=null&&to!=null&&from.isAfter(to)))
                return ResponseEntity.badRequest().body(Map.of("message","Rango de fechas inválido"));
            return ResponseEntity.ok(historial.buscar(u,page,size,query.trim(),from==null?null:from.atStartOfDay(ZoneOffset.UTC).toInstant().toEpochMilli(),to==null?null:to.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant().toEpochMilli()));
        } catch(DateTimeParseException ex){return ResponseEntity.badRequest().body(Map.of("message","Usa fechas válidas con formato yyyy-MM-dd"));}
    }
}
