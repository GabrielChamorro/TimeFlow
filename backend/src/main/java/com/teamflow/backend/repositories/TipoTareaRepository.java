package com.teamflow.backend.repositories;

import com.teamflow.backend.models.TipoTarea;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TipoTareaRepository extends JpaRepository<TipoTarea, Long> {

    Optional<TipoTarea> findByNombreIgnoreCase(String nombre);
}
