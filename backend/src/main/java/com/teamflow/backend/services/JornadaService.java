package com.teamflow.backend.services;

import com.teamflow.backend.dto.JornadaResponse;
import com.teamflow.backend.models.Jornada;
import com.teamflow.backend.models.Usuario;
import com.teamflow.backend.repositories.JornadaRepository;
import com.teamflow.backend.repositories.UsuarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Optional;

@Service
public class JornadaService {
    private final JornadaRepository jornadas;
    private final UsuarioRepository usuarios;

    public JornadaService(JornadaRepository jornadas, UsuarioRepository usuarios) {
        this.jornadas = jornadas;
        this.usuarios = usuarios;
    }

    @Transactional(readOnly = true)
    public Optional<JornadaResponse> obtenerUltima(Long usuarioId) {
        return jornadas.findFirstByUsuarioIdOrderByEntradaDesc(usuarioId).map(JornadaResponse::from);
    }

    /**
     * Bloquea la fila del usuario para serializar Check In, Check Out y creación de tareas.
     * El llamador de crear tarea debe mantener la transacción abierta hasta guardar la tarea.
     */
    @Transactional
    public boolean tieneJornadaActiva(Long usuarioId) {
        if (usuarios.findByIdForUpdate(usuarioId).isEmpty()) return false;
        return jornadas.existsByUsuarioIdAndSalidaIsNull(usuarioId);
    }

    @Transactional
    public Optional<JornadaResponse> registrarEntrada(Long usuarioId) {
        Optional<Usuario> bloqueado = usuarios.findByIdForUpdate(usuarioId);
        if (bloqueado.isEmpty() || jornadas.existsByUsuarioIdAndSalidaIsNull(usuarioId)) return Optional.empty();
        Jornada jornada = new Jornada();
        jornada.setUsuario(bloqueado.get());
        jornada.setEntrada(LocalDateTime.now(ZoneOffset.UTC));
        jornada.setUsuarioActivoId(usuarioId);
        return Optional.of(JornadaResponse.from(jornadas.saveAndFlush(jornada)));
    }

    @Transactional
    public Optional<JornadaResponse> registrarSalida(Long usuarioId) {
        if (usuarios.findByIdForUpdate(usuarioId).isEmpty()) return Optional.empty();
        Optional<Jornada> abierta = jornadas.findFirstByUsuarioIdAndSalidaIsNullOrderByEntradaDesc(usuarioId);
        if (abierta.isEmpty()) return Optional.empty();
        Jornada jornada = abierta.get();
        jornada.setSalida(LocalDateTime.now(ZoneOffset.UTC));
        jornada.setUsuarioActivoId(null);
        return Optional.of(JornadaResponse.from(jornadas.saveAndFlush(jornada)));
    }
}
