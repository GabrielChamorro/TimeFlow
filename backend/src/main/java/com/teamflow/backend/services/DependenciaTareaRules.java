package com.teamflow.backend.services;

import com.teamflow.backend.models.Tarea;
import java.util.*;
import java.util.function.Function;

/** Comprueba las dependencias sin desbordar la pila con cadenas largas. */
public final class DependenciaTareaRules {
    private static final int MAX_DIRECTAS = 500;
    private static final int MAX_NODOS_RECORRIDOS = 10000;
    private DependenciaTareaRules() {}

    private record Paso(Long id, boolean salida) {}

    public static String validar(Long idActual, List<Long> dependencias, Function<Long, Optional<Tarea>> buscar) {
        if (dependencias == null || dependencias.isEmpty()) return null;
        if (dependencias.size() > MAX_DIRECTAS) return "Demasiadas dependencias en una sola tarea";
        Set<Long> directas = new HashSet<>();
        for (Long id : dependencias) {
            if (id == null || id <= 0) return "La tarea elegida como dependencia no es válida";
            if (id.equals(idActual)) return "Una tarea no puede depender de sí misma";
            if (!directas.add(id)) return "No se puede agregar dos veces la misma dependencia";
        }

        // DFS iterativo: detecta ciclos incluso entre ramas de una red compleja.
        Set<Long> enRuta = new HashSet<>();
        Set<Long> completados = new HashSet<>();
        Map<Long, Optional<Tarea>> cache = new HashMap<>();
        for (Long principal : dependencias) {
            Deque<Paso> pendientes = new ArrayDeque<>();
            pendientes.push(new Paso(principal, false));
            while (!pendientes.isEmpty()) {
                Paso paso = pendientes.pop();
                Long id = paso.id();
                if (paso.salida()) {
                    enRuta.remove(id);
                    completados.add(id);
                    continue;
                }
                if (id == null || id <= 0) return "La tarea elegida como dependencia no es válida";
                if (id.equals(idActual)) return "La dependencia crearía un ciclo entre tareas";
                if (enRuta.contains(id)) return "Las tareas seleccionadas contienen un ciclo de dependencias";
                if (completados.contains(id)) continue;
                if (cache.size() >= MAX_NODOS_RECORRIDOS && !cache.containsKey(id))
                    return "La red de dependencias es demasiado grande para validarla";
                Optional<Tarea> anterior = cache.computeIfAbsent(id, buscar);
                if (anterior.isEmpty() || !anterior.get().isActivo())
                    return "La tarea elegida como dependencia no está disponible";
                enRuta.add(id);
                pendientes.push(new Paso(id, true));
                List<Long> padres = anterior.get().getDependenciaIds();
                // Apilamos en orden inverso para mantener la prioridad de los IDs originales.
                for (int i = padres.size() - 1; i >= 0; i--)
                    pendientes.push(new Paso(padres.get(i), false));
            }
        }
        return null;
    }
}
