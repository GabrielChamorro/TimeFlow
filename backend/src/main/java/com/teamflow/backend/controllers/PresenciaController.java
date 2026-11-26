package com.teamflow.backend.controllers;
import com.teamflow.backend.repositories.UsuarioRepository;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController @RequestMapping("/api/jornadas/presencia")
public class PresenciaController {
    private final JdbcTemplate jdbc;
    private final UsuarioRepository usuarios;
    public PresenciaController(JdbcTemplate jdbc,UsuarioRepository usuarios){this.jdbc=jdbc;this.usuarios=usuarios;}
    public record Miembro(Long id,String nombre,String rol,boolean presente) {}
    @GetMapping
    public ResponseEntity<?> consultar(Authentication auth) {
        var usuario=auth==null?null:usuarios.findByEmail(auth.getName()).orElse(null);
        if(usuario==null||"inactivo".equalsIgnoreCase(usuario.getEstado()))return ResponseEntity.status(401).build();
        // Una consulta, sin contraseñas/correos ni N+1. Sesión web no equivale a jornada.
        var miembros=jdbc.query("""
            SELECT u.id,u.nombre,u.rol,
              EXISTS(SELECT 1 FROM jornadas j WHERE j.usuario_id=u.id AND j.salida IS NULL) AS presente
            FROM usuarios u WHERE LOWER(COALESCE(u.estado,'activo')) <> 'inactivo' ORDER BY u.id
            """,(rs,row)->new Miembro(rs.getLong("id"),rs.getString("nombre"),rs.getString("rol"),rs.getBoolean("presente")));
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(Map.of(
            "serverNowMs",System.currentTimeMillis(),"members",miembros,"pollIntervalMs",5000));
    }
}
