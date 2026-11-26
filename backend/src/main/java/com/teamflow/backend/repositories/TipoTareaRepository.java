package com.teamflow.backend.repositories;

import com.teamflow.backend.models.TipoTarea;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TipoTareaRepository extends JpaRepository<TipoTarea, Long> {

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select t from TipoTarea t where t.id=:id")
    Optional<TipoTarea> findByIdForUpdate(@org.springframework.data.repository.query.Param("id") Long id);
    Optional<TipoTarea> findByNombreIgnoreCase(String nombre);
    java.util.List<TipoTarea> findByActivoTrue();
}
