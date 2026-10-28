package com.teamflow.backend.controllers;

import com.teamflow.backend.models.Mensaje;
import com.teamflow.backend.models.Usuario;
import com.teamflow.backend.repositories.MensajeRepository;
import com.teamflow.backend.repositories.UsuarioRepository;
import com.teamflow.backend.security.InputSecurity;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/mensajes")
public class MensajeController {

    private static final int MAX_MENSAJE = 2000;

    private final MensajeRepository mensajeRepository;
    private final UsuarioRepository usuarioRepository;

    public MensajeController(MensajeRepository mensajeRepository, UsuarioRepository usuarioRepository) {
        this.mensajeRepository = mensajeRepository;
        this.usuarioRepository = usuarioRepository;
    }

    @GetMapping
    public ResponseEntity<?> obtenerTodos(Authentication authentication) {
        Usuario usuario = obtenerUsuarioAutenticado(authentication);
        if (usuario == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Sesión inválida"));
        }

        Long usuarioId = usuario.getId();
        List<Mensaje> visibles = mensajeRepository.findAll().stream()
                .filter(mensaje -> esCanalPublico(mensaje)
                        || usuarioId.equals(mensaje.getSenderId())
                        || usuarioId.equals(mensaje.getRecipientId()))
                .toList();

        return ResponseEntity.ok(visibles);
    }

    @PostMapping
    public ResponseEntity<?> enviarMensaje(@RequestBody Mensaje mensaje, Authentication authentication) {
        Usuario usuario = obtenerUsuarioAutenticado(authentication);
        if (usuario == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Sesión inválida"));
        }

        if (mensaje == null || mensaje.getText() == null || mensaje.getText().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "El mensaje no puede estar vacío"));
        }
        String longitudError = InputSecurity.validarLongitud(mensaje.getText(), MAX_MENSAJE, "El mensaje");
        if (longitudError != null) {
            return ResponseEntity.badRequest().body(Map.of("message", longitudError));
        }

        String chatId = mensaje.getChatId() == null ? null : mensaje.getChatId().trim().toLowerCase();
        boolean anuncio = "announcements".equals(chatId);
        boolean general = "general".equals(chatId);
        boolean directo = (chatId == null || chatId.isBlank()) && mensaje.getRecipientId() != null;

        if (!anuncio && !general && !directo) {
            return ResponseEntity.badRequest().body(Map.of("message", "El canal de mensaje no es válido"));
        }
        if (anuncio && !esAdmin(usuario)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Solo un administrador puede publicar anuncios oficiales"));
        }
        if (directo) {
            if (usuario.getId().equals(mensaje.getRecipientId())) {
                return ResponseEntity.badRequest().body(Map.of("message", "No puedes enviarte un mensaje directo a ti mismo"));
            }
            if (!usuarioRepository.existsById(mensaje.getRecipientId())) {
                return ResponseEntity.badRequest().body(Map.of("message", "El destinatario no existe"));
            }
            mensaje.setChatId(null);
        } else {
            mensaje.setChatId(chatId);
            mensaje.setRecipientId(null);
        }

        // Estos datos siempre salen de la identidad JWT y del reloj del servidor.
        mensaje.setId(null);
        mensaje.setSenderId(usuario.getId());
        mensaje.setSenderName(usuario.getNombre());
        mensaje.setSenderRole(usuario.getRol());
        mensaje.setSenderAvatar(iniciales(usuario.getNombre()));
        mensaje.setText(mensaje.getText().trim());
        mensaje.setTimestamp(LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm")));

        return ResponseEntity.status(HttpStatus.CREATED).body(mensajeRepository.save(mensaje));
    }

    private boolean esCanalPublico(Mensaje mensaje) {
        return "general".equalsIgnoreCase(mensaje.getChatId())
                || "announcements".equalsIgnoreCase(mensaje.getChatId());
    }

    private Usuario obtenerUsuarioAutenticado(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return null;
        }
        return usuarioRepository.findByEmail(authentication.getName()).orElse(null);
    }

    private boolean esAdmin(Usuario usuario) {
        return usuario != null && "admin".equalsIgnoreCase(usuario.getRol());
    }

    private String iniciales(String nombre) {
        if (nombre == null || nombre.isBlank()) {
            return "US";
        }

        String[] partes = nombre.trim().split("\\s+");
        StringBuilder iniciales = new StringBuilder();
        for (String parte : partes) {
            if (!parte.isBlank()) {
                iniciales.append(Character.toUpperCase(parte.charAt(0)));
            }
            if (iniciales.length() == 2) {
                break;
            }
        }
        return iniciales.toString();
    }
}
