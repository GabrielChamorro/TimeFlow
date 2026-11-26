package com.teamflow.backend.controllers;

import com.teamflow.backend.repositories.UsuarioRepository;
import com.teamflow.backend.security.TaskAccessRules;
import com.teamflow.backend.services.JornadaService;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.LinkedHashMap;

/** Metadatos de actualización: no descarga evidencias/bitácoras en cada intervalo. */
@RestController @RequestMapping("/api/tareas/sincronizacion")
public class TaskSyncController {
    private final JdbcTemplate jdbc;
    private final UsuarioRepository usuarios;
    private final JornadaService jornadas;
    public TaskSyncController(JdbcTemplate jdbc, UsuarioRepository usuarios, JornadaService jornadas) {
        this.jdbc=jdbc; this.usuarios=usuarios; this.jornadas=jornadas;
    }
    public record Clock(Long id, Long version, String estado, Long tiempoAcumuladoMs, Long tiempoInicioMs, Long ultimoRegistroId) {}
    @GetMapping public ResponseEntity<?> consultar(Authentication auth) {
        var usuario=auth==null?null:usuarios.findByEmail(auth.getName()).orElse(null);
        if(usuario==null||"inactivo".equalsIgnoreCase(usuario.getEstado()))return ResponseEntity.status(401).build();
        boolean admin=TaskAccessRules.admin(usuario);
        // Una sola resolución para propietarios heredados, sin N+1 por cada tarea.
        java.util.List<com.teamflow.backend.models.Usuario> homonimos=admin||usuario.getNombre()==null?java.util.List.of():usuarios.findAllByNombreIgnoreCase(usuario.getNombre());
        boolean nombreUnico=homonimos!=null&&homonimos.size()==1&&usuario.getId().equals(homonimos.get(0).getId());
        var tareas=jdbc.query("""
            SELECT t.id,t.version,t.estado,t.asignado_usuario_id,t.asignado_a,
              t.tiempo_acumulado_ms,t.tiempo_inicio_ms,
              (SELECT MAX(r.id) FROM tarea_registros r WHERE r.tarea_id=t.id) AS ultimo_registro_id
            FROM tareas t WHERE t.activo=1 ORDER BY t.id
            """,(rs,row)->{
                Long owner=rs.getObject("asignado_usuario_id",Long.class);
                boolean puedeLeer=admin || (owner!=null?owner.equals(usuario.getId()):nombreUnico&&usuario.getNombre().equalsIgnoreCase(rs.getString("asignado_a")));
                return new Clock(rs.getLong("id"),rs.getObject("version",Long.class),rs.getString("estado"),
                    puedeLeer?rs.getObject("tiempo_acumulado_ms",Long.class):null,
                    puedeLeer?rs.getObject("tiempo_inicio_ms",Long.class):null,
                    puedeLeer?rs.getObject("ultimo_registro_id",Long.class):null);
            });
        var body=new LinkedHashMap<String,Object>();
        body.put("tasks",tareas);body.put("ownJornada",jornadas.obtenerUltima(usuario.getId()).orElse(null));
        body.put("serverNowMs",System.currentTimeMillis());body.put("pollIntervalMs",5000);
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(body);
    }
}
