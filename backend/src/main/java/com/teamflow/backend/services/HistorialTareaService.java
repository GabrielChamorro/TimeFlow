package com.teamflow.backend.services;
import com.teamflow.backend.models.Usuario;
import com.teamflow.backend.security.TaskAccessRules;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import java.util.*;

@Service
public class HistorialTareaService {
    private final JdbcTemplate jdbc;
    public HistorialTareaService(JdbcTemplate jdbc) { this.jdbc=jdbc; }
    public record Resumen(Long id,String codigo,String nombre,String responsable,String estado,String fechaCreacion,Long finalizadaEnMs) {}
    public Map<String,Object> buscar(Usuario usuario,int page,int size,String query,Long desde,Long hasta) {
        var where=new StringBuilder(" WHERE estado='Finalizada' AND activo=1");
        var args=new ArrayList<Object>();
        if (!TaskAccessRules.admin(usuario)) {
            where.append(" AND (asignado_usuario_id=? OR (asignado_usuario_id IS NULL AND LOWER(asignado_a)=LOWER(?) AND 1=(SELECT COUNT(*) FROM usuarios WHERE LOWER(nombre)=LOWER(?))))");
            args.add(usuario.getId());args.add(usuario.getNombre());args.add(usuario.getNombre());
        }
        if (desde!=null) {where.append(" AND finalizada_en_ms>=?");args.add(desde);}
        if (hasta!=null) {where.append(" AND finalizada_en_ms<?");args.add(hasta);}
        if (!query.isBlank()) {
            where.append(" AND (nombre LIKE ? ESCAPE '!' OR codigo LIKE ? ESCAPE '!' OR asignado_a LIKE ? ESCAPE '!')");
            String escaped="%"+query.replace("!","!!").replace("%","!%").replace("_","!_")+"%";
            args.add(escaped);args.add(escaped);args.add(escaped);
        }
        Long count=jdbc.queryForObject("SELECT COUNT(*) FROM tareas"+where,Long.class,args.toArray());
        args.add(size);args.add((long)page*size);
        // Proyección SQL: nunca se seleccionan bitácoras, evidencias ni colecciones para la lista.
        var rows=jdbc.query("SELECT id,codigo,nombre,asignado_a,estado,fecha,finalizada_en_ms FROM tareas"+where+" ORDER BY finalizada_en_ms DESC,id DESC LIMIT ? OFFSET ?",
            (rs,n)->new Resumen(rs.getLong("id"),rs.getString("codigo"),rs.getString("nombre"),rs.getString("asignado_a"),rs.getString("estado"),rs.getString("fecha"),(Long)rs.getObject("finalizada_en_ms")),args.toArray());
        long total=count==null?0:count;
        return Map.of("content",rows,"page",page,"size",size,"totalElements",total,"totalPages",(total+size-1)/size);
    }
}
