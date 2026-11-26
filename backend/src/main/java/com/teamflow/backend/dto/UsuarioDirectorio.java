package com.teamflow.backend.dto;

import com.teamflow.backend.models.Usuario;

/** Datos que el chat necesita sin exponer el correo de otros trabajadores. */
public record UsuarioDirectorio(Long id, String nombre, String rol, String estado) {
    public static UsuarioDirectorio from(Usuario usuario) {
        return new UsuarioDirectorio(usuario.getId(), usuario.getNombre(), usuario.getRol(), usuario.getEstado());
    }
}
