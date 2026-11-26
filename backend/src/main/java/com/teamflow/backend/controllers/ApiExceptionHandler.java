package com.teamflow.backend.controllers;

import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

@RestControllerAdvice
public class ApiExceptionHandler {
    @ExceptionHandler(org.springframework.web.method.annotation.MethodArgumentTypeMismatchException.class)
    public org.springframework.http.ResponseEntity<?> parametroInvalido() {
        // Resolver aquí evita un dispatch /error que se confunda con una sesión inválida.
        return org.springframework.http.ResponseEntity.badRequest().body(java.util.Map.of("message", "El parámetro de la solicitud no es válido"));
    }
    @ExceptionHandler(org.springframework.orm.ObjectOptimisticLockingFailureException.class)
    public ResponseEntity<?> edicionConcurrente() {
        return ResponseEntity.status(409).body(Map.of("message", "Otra sesión modificó el registro. Conserva tu borrador y revisa la versión reciente."));
    }
    // Resolver antes del despacho /error, que pierde la autenticación stateless.
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<?> archivoDemasiadoGrande() {
        return ResponseEntity.status(413).body(Map.of("message", "El archivo supera 60 MB o la solicitud supera 61 MB"));
    }
}
