package com.teamflow.backend.repositories;
import com.teamflow.backend.models.RegistroTarea;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.JpaRepository;
public interface RegistroTareaRepository extends JpaRepository<RegistroTarea,Long> {
    Page<RegistroTarea> findByTareaIdAndTipoInOrderByCreadoEnMsAscIdAsc(Long tareaId,java.util.List<String> tipos,Pageable pageable);
}
