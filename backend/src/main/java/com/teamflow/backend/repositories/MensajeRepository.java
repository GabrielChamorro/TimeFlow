package com.teamflow.backend.repositories;

import com.teamflow.backend.models.Mensaje;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MensajeRepository extends JpaRepository<Mensaje, Long> {
}