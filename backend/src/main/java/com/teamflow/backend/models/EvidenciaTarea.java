package com.teamflow.backend.models;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "evidencias_tarea")
public class EvidenciaTarea {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name="tarea_id", nullable=false)
    private Long tareaId;
    @Column(name="nombre_original", nullable=false, length=200)
    private String nombreOriginal;
    @Column(name="tipo_mime", nullable=false, length=100)
    private String tipoMime;
    @Column(name="tamano_bytes", nullable=false)
    private Long tamanoBytes;
    @Column(name="fecha_subida", nullable=false)
    private LocalDateTime fechaSubida = LocalDateTime.now();
    @Lob @Column(name="contenido", columnDefinition="LONGBLOB", nullable=false)
    private byte[] contenido;
    // Desactivado = conservado en MySQL, oculto en la aplicacion.
    @Column(name = "activo", nullable = false)
    private Boolean activo = true;

    public boolean isActivo() { return !Boolean.FALSE.equals(activo); }
    public void setActivo(Boolean activo) { this.activo = activo; }

    public Long getId() { return id; }
    public Long getTareaId() { return tareaId; }
    public void setTareaId(Long tareaId) { this.tareaId = tareaId; }
    public String getNombreOriginal() { return nombreOriginal; }
    public void setNombreOriginal(String nombreOriginal) { this.nombreOriginal = nombreOriginal; }
    public String getTipoMime() { return tipoMime; }
    public void setTipoMime(String tipoMime) { this.tipoMime = tipoMime; }
    public Long getTamanoBytes() { return tamanoBytes; }
    public void setTamanoBytes(Long tamanoBytes) { this.tamanoBytes = tamanoBytes; }
    public LocalDateTime getFechaSubida() { return fechaSubida; }
    public byte[] getContenido() { return contenido; }
    public void setContenido(byte[] contenido) { this.contenido = contenido; }
}
