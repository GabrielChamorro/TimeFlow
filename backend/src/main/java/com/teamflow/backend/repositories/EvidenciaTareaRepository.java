package com.teamflow.backend.repositories;
import com.teamflow.backend.dto.EvidenciaResumen;
import com.teamflow.backend.models.EvidenciaTarea;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
public interface EvidenciaTareaRepository extends JpaRepository<EvidenciaTarea, Long> {
    @Query("select new com.teamflow.backend.dto.EvidenciaResumen(e.id, e.nombreOriginal, e.tipoMime, e.tamanoBytes, e.fechaSubida) from EvidenciaTarea e where e.tareaId=:tareaId and e.activo=true order by e.id desc")
    List<EvidenciaResumen> resumirPorTarea(@Param("tareaId") Long tareaId);

    long countByTareaId(Long tareaId);

    @Query("select coalesce(sum(e.tamanoBytes), 0) from EvidenciaTarea e where e.tareaId=:tareaId")
    long bytesTotalesPorTarea(@Param("tareaId") Long tareaId);
}
