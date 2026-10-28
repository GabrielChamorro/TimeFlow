package com.teamflow.backend.dto;

import com.teamflow.backend.models.Jornada;
import java.time.Duration;
import java.time.ZoneOffset;

/** Horas en UTC con sufijo Z para que el navegador use la zona horaria local. */
public record JornadaResponse(Long id, String checkInAt, String checkOutAt,
                              boolean activa, Long duracionSegundos) {
    public static JornadaResponse from(Jornada jornada) {
        boolean activa = jornada.getSalida() == null;
        return new JornadaResponse(
                jornada.getId(),
                jornada.getEntrada().atOffset(ZoneOffset.UTC).toString(),
                activa ? null : jornada.getSalida().atOffset(ZoneOffset.UTC).toString(),
                activa,
                activa ? null : Math.max(0, Duration.between(jornada.getEntrada(), jornada.getSalida()).getSeconds())
        );
    }
}
