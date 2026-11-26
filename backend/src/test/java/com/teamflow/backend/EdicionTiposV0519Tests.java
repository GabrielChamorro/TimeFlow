package com.teamflow.backend;
import com.teamflow.backend.controllers.TipoTareaController;
import com.teamflow.backend.models.TipoTarea;
import com.teamflow.backend.repositories.TipoTareaRepository;
import org.junit.jupiter.api.Test;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
class EdicionTiposV0519Tests {
    @Test void versionObsoletaNoSobrescribeDescripcion() {
        var repo=mock(TipoTareaRepository.class);var c=new TipoTareaController(repo);
        var current=new TipoTarea("Actual","Remota");current.setId(1L);current.setVersion(2L);
        var input=new TipoTarea("Local","Borrador");input.setVersion(1L);
        when(repo.findByIdForUpdate(1L)).thenReturn(Optional.of(current));
        assertEquals(409,c.actualizar(1L,input).getStatusCode().value());assertEquals("Remota",current.getDescripcion());verify(repo,never()).save(any());
    }
    @Test void desactivarMientrasSeEditaDevuelve409() {
        var repo=mock(TipoTareaRepository.class);var c=new TipoTareaController(repo);
        var current=new TipoTarea("Actual","Remota");current.setActivo(false);current.setVersion(2L);
        when(repo.findByIdForUpdate(1L)).thenReturn(Optional.of(current));
        assertEquals(409,c.actualizar(1L,new TipoTarea("Local","Borrador")).getStatusCode().value());verify(repo,never()).save(any());
    }
    @Test void versionActualActualizaBajoBloqueo() {
        var repo=mock(TipoTareaRepository.class);var c=new TipoTareaController(repo);
        var current=new TipoTarea("Actual","Remota");current.setVersion(2L);
        var input=new TipoTarea("Actual","Revisada");input.setVersion(2L);
        when(repo.findByIdForUpdate(1L)).thenReturn(Optional.of(current));when(repo.save(current)).thenReturn(current);
        assertEquals(200,c.actualizar(1L,input).getStatusCode().value());assertEquals("Revisada",current.getDescripcion());
    }
}
