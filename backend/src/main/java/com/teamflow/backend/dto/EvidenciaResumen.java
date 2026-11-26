package com.teamflow.backend.dto;
import java.time.LocalDateTime;
public record EvidenciaResumen(Long id, String nombreOriginal, String tipoMime, Long tamanoBytes, LocalDateTime fechaSubida) {}
