package com.teamflow.backend.security;

import com.teamflow.backend.models.Tarea;
import com.teamflow.backend.models.Usuario;
import com.teamflow.backend.repositories.UsuarioRepository;

/** El nombre visible no debe servir como identificador de permisos. */
public final class TaskAccessRules {
    private TaskAccessRules() {}

    public static boolean admin(Usuario usuario) {
        return usuario != null && "admin".equalsIgnoreCase(usuario.getRol());
    }

    public static boolean responsable(Usuario usuario, Tarea tarea, UsuarioRepository usuarios) {
        if (usuario == null || tarea == null || usuario.getId() == null) return false;
        if (tarea.getAsignadoUsuarioId() != null) {
            return usuario.getId().equals(tarea.getAsignadoUsuarioId());
        }
        // Compatibilidad con tareas anteriores a la migracion: solo si el nombre es unico.
        if (usuario.getNombre() == null || tarea.getAsignadoA() == null
                || !usuario.getNombre().equalsIgnoreCase(tarea.getAsignadoA())) return false;
        var coincidencias = usuarios.findAllByNombreIgnoreCase(tarea.getAsignadoA());
        return coincidencias != null && coincidencias.size() == 1
                && usuario.getId().equals(coincidencias.get(0).getId());
    }

    public static boolean puedeLeer(Usuario usuario, Tarea tarea, UsuarioRepository usuarios) {
        return admin(usuario) || responsable(usuario, tarea, usuarios);
    }
}
