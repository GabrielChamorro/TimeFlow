package com.teamflow.backend.repositories;

import com.teamflow.backend.models.Tarea;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TareaRepository extends JpaRepository<Tarea, Long> {
    java.util.List<Tarea> findByActivoTrue();

    // Bloqueo común a todos los cambios de dependencias: serializa las
    // comprobaciones de ciclos con otras solicitudes concurrentes.
    // La primera fila (ID menor) permanece, porque TimeFlow desactiva
    // registros en lugar de eliminarlos físicamente.
    @org.springframework.data.jpa.repository.Query(
        value = "SELECT id FROM tareas ORDER BY id LIMIT 1 FOR UPDATE", nativeQuery = true)
    Long bloquearRedDependencias();

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select t from Tarea t where t.id = :id")
    java.util.Optional<Tarea> findByIdForUpdate(@org.springframework.data.repository.query.Param("id") Long id);
}