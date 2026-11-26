package com.teamflow.backend.models;

import jakarta.persistence.*;

@Entity
@Table(name = "tareas")
public class Tarea {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Version
    @Column(nullable = false)
    private Long version;
    public Long getVersion() { return version; }
    public void setVersion(Long version) { this.version = version; }

    private String codigo; // Ej: NODE-101
    private String nombre;

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    // Un requisito previo por fila en tarea_dependencias. La columna antigua
    // tareas.dependencia_id se conserva en SQL solo por compatibilidad histórica.
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "tarea_dependencias", joinColumns = @JoinColumn(name = "tarea_id"))
    @Column(name = "dependencia_id", nullable = false)
    private java.util.List<Long> dependenciaIds = new java.util.ArrayList<>();

    private String tipo;
    @Column(name = "asignado_a")
    private String asignadoA;

    // Identidad estable del responsable. El nombre se mantiene para mostrarlo en pantalla.
    @Column(name = "asignado_usuario_id")
    private Long asignadoUsuarioId;

    @Column(name = "fecha")
    private String fecha; // yyyy-MM-dd, fecha calendario de la tarea

    private String fechaInicio; // hora de inicio, HH:mm
    private String fechaFin;
    @Column(name="finalizada_en_ms")
    private Long finalizadaEnMs;
    public Long getFinalizadaEnMs() { return finalizadaEnMs; }
    public void setFinalizadaEnMs(Long value) { finalizadaEnMs = value; }
    @Column(name="tiempo_acumulado_ms")
    private Long tiempoAcumuladoMs;
    @Column(name="tiempo_inicio_ms")
    private Long tiempoInicioMs;
    @com.fasterxml.jackson.annotation.JsonProperty(access=com.fasterxml.jackson.annotation.JsonProperty.Access.READ_ONLY)
    public Long getTiempoAcumuladoMs() { return tiempoAcumuladoMs; }
    public void setTiempoAcumuladoMs(Long value) { tiempoAcumuladoMs = value; }
    @com.fasterxml.jackson.annotation.JsonProperty(access=com.fasterxml.jackson.annotation.JsonProperty.Access.READ_ONLY)
    public Long getTiempoInicioMs() { return tiempoInicioMs; }
    public void setTiempoInicioMs(Long value) { tiempoInicioMs = value; }
    @Transient
    private Long ultimoRegistroId;
    @com.fasterxml.jackson.annotation.JsonProperty(access=com.fasterxml.jackson.annotation.JsonProperty.Access.READ_ONLY)
    public Long getUltimoRegistroId() { return ultimoRegistroId; }
    public void setUltimoRegistroId(Long value) { ultimoRegistroId = value; }
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
    @Transient
    private String motivoRechazo;
    public String getMotivoRechazo() { return motivoRechazo; }
    public void setMotivoRechazo(String motivoRechazo) { this.motivoRechazo = motivoRechazo; }

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String evidencia;

    // Desactivado = conservado en MySQL, oculto en la aplicacion.
    @Column(name = "activo", nullable = false)
    private Boolean activo = true;

    public boolean isActivo() { return !Boolean.FALSE.equals(activo); }
    public void setActivo(Boolean activo) { this.activo = activo; }

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

    public java.util.List<Long> getDependenciaIds() {
        return dependenciaIds == null ? java.util.List.of() : dependenciaIds;
    }
    public void setDependenciaIds(java.util.List<Long> dependenciaIds) {
        this.dependenciaIds = dependenciaIds == null ? new java.util.ArrayList<>() : new java.util.ArrayList<>(dependenciaIds);
    }

    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }

    public String getAsignadoA() { return asignadoA; }
    public void setAsignadoA(String asignadoA) { this.asignadoA = asignadoA; }
    public Long getAsignadoUsuarioId() { return asignadoUsuarioId; }
    public void setAsignadoUsuarioId(Long asignadoUsuarioId) { this.asignadoUsuarioId = asignadoUsuarioId; }

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
