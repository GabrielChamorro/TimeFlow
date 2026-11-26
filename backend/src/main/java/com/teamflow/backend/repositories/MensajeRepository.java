package com.teamflow.backend.repositories;

import com.teamflow.backend.models.Mensaje;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MensajeRepository extends JpaRepository<Mensaje, Long> {
    // El filtro se ejecuta en MySQL, no en la memoria del servidor.
    // Mantener la regla original: anuncios y chat general son públicos,
    // los mensajes directos solo se ven si el usuario participa.
    @Query("""
            SELECT m FROM Mensaje m
            WHERE m.activo = true AND (
                  LOWER(m.chatId) IN ('announcements', 'general')
               OR m.senderId = :usuarioId
               OR m.recipientId = :usuarioId
            )
            ORDER BY m.id ASC
            """)
    List<Mensaje> findVisiblesParaUsuario(@Param("usuarioId") Long usuarioId);
}
