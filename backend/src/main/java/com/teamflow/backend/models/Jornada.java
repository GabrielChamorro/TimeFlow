package com.teamflow.backend.models;

import jakarta.persistence.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
import java.time.LocalDateTime;

/** Jornada registrada por el servidor en UTC; nunca se acepta el usuario ni la hora desde el cliente. */
@Entity
@Table(name = "jornadas", indexes = {
        @Index(name = "idx_jornadas_usuario_entrada", columnList = "usuario_id, entrada")
})
public class Jornada {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE) // Conservar el borrado de cuentas: borra sus jornadas asociadas.
    private Usuario usuario;

    @Column(name = "entrada", nullable = false)
    private LocalDateTime entrada;

    @Column(name = "salida")
    private LocalDateTime salida;

    // El índice UNIQUE permite varios históricos (NULL) pero solo una jornada abierta por usuario.
    @Column(name = "usuario_activo_id", unique = true)
    private Long usuarioActivoId;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Usuario getUsuario() { return usuario; }
    public void setUsuario(Usuario usuario) { this.usuario = usuario; }
    public LocalDateTime getEntrada() { return entrada; }
    public void setEntrada(LocalDateTime entrada) { this.entrada = entrada; }
    public LocalDateTime getSalida() { return salida; }
    public void setSalida(LocalDateTime salida) { this.salida = salida; }
    public Long getUsuarioActivoId() { return usuarioActivoId; }
    public void setUsuarioActivoId(Long usuarioActivoId) { this.usuarioActivoId = usuarioActivoId; }
}
