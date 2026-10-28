package com.teamflow.backend.models;

import jakarta.persistence.*;

@Entity
@Table(name = "tareas")
public class Tarea {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String codigo; // Ej: NODE-101
    private String nombre;

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    private String tipo;
    @Column(name = "asignado_a")
    private String asignadoA;

    @Column(name = "fecha")
    private String fecha; // yyyy-MM-dd, fecha calendario de la tarea

    private String fechaInicio; // hora de inicio, HH:mm
    private String fechaFin;
    private String fechaLimite; // fecha y hora límite, yyyy-MM-ddTHH:mm
    private String meta;
    private Boolean metaCumplida = false;
    private String estado = "En Progreso"; // 'En Progreso' | 'En Revisión' | 'Finalizada'

    @Column(name = "posicion_x")
    private Double posicionX;

    @Column(name = "posicion_y")
    private Double posicionY;

    @Column(columnDefinition = "TEXT")
    private String bitacora;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String evidencia;

    public Tarea() {}

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCodigo() { return codigo; }
    public void setCodigo(String codigo) { this.codigo = codigo; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }

    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }

    public String getAsignadoA() { return asignadoA; }
    public void setAsignadoA(String asignadoA) { this.asignadoA = asignadoA; }

    public String getFecha() { return fecha; }
    public void setFecha(String fecha) { this.fecha = fecha; }

    public String getFechaInicio() { return fechaInicio; }
    public void setFechaInicio(String fechaInicio) { this.fechaInicio = fechaInicio; }

    public String getFechaFin() { return fechaFin; }
    public void setFechaFin(String fechaFin) { this.fechaFin = fechaFin; }

    public String getFechaLimite() { return fechaLimite; }
    public void setFechaLimite(String fechaLimite) { this.fechaLimite = fechaLimite; }

    public String getMeta() { return meta; }
    public void setMeta(String meta) { this.meta = meta; }

    public Boolean getMetaCumplida() { return metaCumplida; }
    public void setMetaCumplida(Boolean metaCumplida) { this.metaCumplida = metaCumplida; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }

    public Double getPosicionX() { return posicionX; }
    public void setPosicionX(Double posicionX) { this.posicionX = posicionX; }

    public Double getPosicionY() { return posicionY; }
    public void setPosicionY(Double posicionY) { this.posicionY = posicionY; }

    public String getBitacora() { return bitacora; }
    public void setBitacora(String bitacora) { this.bitacora = bitacora; }

    public String getEvidencia() { return evidencia; }
    public void setEvidencia(String evidencia) { this.evidencia = evidencia; }
}