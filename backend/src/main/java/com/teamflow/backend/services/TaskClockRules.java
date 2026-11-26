package com.teamflow.backend.services;

import com.teamflow.backend.models.Tarea;

/** Tiempo operativo en En Progreso; revisión y desactivación no acumulan. */
public final class TaskClockRules {
    private TaskClockRules() {}
    public static void iniciar(Tarea tarea, long now) {
        tarea.setTiempoAcumuladoMs(0L);
        tarea.setTiempoInicioMs(now);
    }
    public static void transicionar(Tarea tarea, String estado, boolean activo, long now) {
        // NULL significa historia insuficiente. Nunca convertirla en una duración inventada.
        if (tarea.getTiempoAcumuladoMs() == null) return;
        boolean antes = tarea.isActivo() && "En Progreso".equals(tarea.getEstado());
        boolean despues = activo && "En Progreso".equals(estado);
        if (antes && !despues && tarea.getTiempoInicioMs() != null) {
            long segmento = Math.max(0L, now - tarea.getTiempoInicioMs());
            long acumulado = tarea.getTiempoAcumuladoMs();
            tarea.setTiempoAcumuladoMs(segmento > Long.MAX_VALUE - acumulado ? Long.MAX_VALUE : acumulado + segmento);
            tarea.setTiempoInicioMs(null);
        } else if (!antes && despues) tarea.setTiempoInicioMs(now);
    }
}
