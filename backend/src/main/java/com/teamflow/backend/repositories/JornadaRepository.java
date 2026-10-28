package com.teamflow.backend.repositories;

import com.teamflow.backend.models.Jornada;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface JornadaRepository extends JpaRepository<Jornada, Long> {
    boolean existsByUsuarioIdAndSalidaIsNull(Long usuarioId);
    Optional<Jornada> findFirstByUsuarioIdAndSalidaIsNullOrderByEntradaDesc(Long usuarioId);
    Optional<Jornada> findFirstByUsuarioIdOrderByEntradaDesc(Long usuarioId);
}
