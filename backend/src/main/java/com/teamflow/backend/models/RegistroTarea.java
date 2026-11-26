package com.teamflow.backend.models;
import jakarta.persistence.*;

/** Registro inmutable desde la API; identidad, autor y fecha los asigna el servidor. */
@Entity @Table(name="tarea_registros")
public class RegistroTarea {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) public Long id;
    @Column(name="tarea_id",nullable=false) public Long tareaId;
    @Column(name="autor_id") public Long autorId;
    @Column(name="autor_nombre") public String autorNombre;
    @Column(nullable=false) public String tipo;
    @Column(nullable=false,columnDefinition="TEXT") public String contenido;
    @Column(name="creado_en_ms") public Long creadoEnMs;
    public static RegistroTarea legado(Tarea tarea) {
        var r=new RegistroTarea();r.tareaId=tarea.getId();r.tipo="LEGADO";
        r.contenido=tarea.getBitacora();return r;
    }
    public static RegistroTarea nuevo(Tarea tarea, Usuario autor, String tipo, String contenido) {
        var r=new RegistroTarea(); r.tareaId=tarea.getId();r.autorId=autor.getId();
        r.autorNombre=autor.getNombre();r.tipo=tipo;r.contenido=contenido.trim();
        r.creadoEnMs=System.currentTimeMillis();return r;
    }
}
