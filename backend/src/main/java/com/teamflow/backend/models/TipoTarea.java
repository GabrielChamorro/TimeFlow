package com.teamflow.backend.models;

import jakarta.persistence.*;

@Entity
@Table(name = "tipos_tarea")
public class TipoTarea {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String nombre;

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    // Desactivado = conservado en MySQL, oculto en la aplicacion.
    @Column(name = "activo", nullable = false)
    private Boolean activo = true;

    public boolean isActivo() { return !Boolean.FALSE.equals(activo); }
    public void setActivo(Boolean activo) { this.activo = activo; }

    public TipoTarea() {}

    public TipoTarea(String nombre, String descripcion) {
        this.nombre = nombre;
        this.descripcion = descripcion;
    }

    @Version
    @Column(nullable=false)
    private Long version;
    public Long getVersion() { return version; }
    public void setVersion(Long version) { this.version=version; }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }
}