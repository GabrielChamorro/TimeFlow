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
        List<Mensaje> visibles = mensajeRepository.findVisiblesParaUsuario(usuarioId);

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
            if (usuarioRepository.findById(mensaje.getRecipientId())
                    .filter(destino -> !"inactivo".equalsIgnoreCase(destino.getEstado())).isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "El destinatario no existe"));
            }
            mensaje.setChatId(null);
        } else {
            mensaje.setChatId(chatId);
            mensaje.setRecipientId(null);
        }

        // Estos datos siempre salen de la identidad JWT y del reloj del servidor.
        mensaje.setId(null);
        mensaje.setActivo(true);
        mensaje.setSenderId(usuario.getId());
        mensaje.setSenderName(usuario.getNombre());
        mensaje.setSenderRole(usuario.getRol());
        mensaje.setSenderAvatar(iniciales(usuario.getNombre()));
        mensaje.setText(mensaje.getText().trim());
        mensaje.setTimestamp(LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm")));

        return ResponseEntity.status(HttpStatus.CREATED).body(mensajeRepository.save(mensaje));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> desactivarMensaje(@PathVariable Long id, Authentication authentication) {
        Usuario usuario = obtenerUsuarioAutenticado(authentication);
        if (usuario == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        Mensaje mensaje = mensajeRepository.findById(id).orElse(null);
        if (mensaje == null || !mensaje.isActivo()) return ResponseEntity.notFound().build();
        if (!esAdmin(usuario) && !usuario.getId().equals(mensaje.getSenderId()))
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        mensaje.setActivo(false);
        mensajeRepository.save(mensaje);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/reactivar")
    public ResponseEntity<?> reactivarMensaje(@PathVariable Long id, Authentication authentication) {
        Usuario usuario = obtenerUsuarioAutenticado(authentication);
        if (usuario == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        if (!esAdmin(usuario)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        Mensaje mensaje = mensajeRepository.findById(id).orElse(null);
        if (mensaje == null || mensaje.isActivo()) return ResponseEntity.notFound().build();
        mensaje.setActivo(true);
        return ResponseEntity.ok(mensajeRepository.save(mensaje));
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
