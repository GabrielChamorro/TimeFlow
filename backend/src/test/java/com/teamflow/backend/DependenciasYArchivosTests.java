package com.teamflow.backend;

import com.teamflow.backend.models.Tarea;
import com.teamflow.backend.services.DependenciaTareaRules;
import com.teamflow.backend.security.EvidenciaArchivoRules;
import org.junit.jupiter.api.Test;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
class DependenciasYArchivosTests {
    @Test void limiteEvidenciaDeSesentaMbYCuotaPorTarea() {
        assertFalse(EvidenciaArchivoRules.tamanoValido(0));
        assertTrue(EvidenciaArchivoRules.tamanoValido(60L*1024*1024));
        assertFalse(EvidenciaArchivoRules.tamanoValido(60L*1024*1024+1));
        assertEquals(300L*1024*1024, EvidenciaArchivoRules.MAX_BYTES_POR_TAREA);
    }
    @Test void sinDependenciaEsValida() { assertNull(DependenciaTareaRules.validar(1L,List.of(),id->Optional.empty())); }
    @Test void noPermiteAutoDependencia() { assertNotNull(DependenciaTareaRules.validar(1L,List.of(1L),id->Optional.empty())); }
    @Test void rechazaReferenciaInexistente() { assertNotNull(DependenciaTareaRules.validar(1L,List.of(9L),id->Optional.empty())); }
    @Test void rechazaDuplicados() { assertNotNull(DependenciaTareaRules.validar(1L,List.of(2L,2L),id->Optional.empty())); }
    @Test void detectaCicloIndirectoEnRama() {
        Tarea b=new Tarea(); b.setId(2L); b.setDependenciaIds(List.of(3L,4L));
        Tarea c=new Tarea(); c.setId(3L);
        Tarea d=new Tarea(); d.setId(4L); d.setDependenciaIds(List.of(1L));
        assertNotNull(DependenciaTareaRules.validar(1L,List.of(2L),id->Optional.of(id==2?b:id==3?c:d)));
    }
    @Test void aceptaVariasDependencias() {
        Tarea b=new Tarea(); b.setId(2L); b.setDependenciaIds(List.of(4L));
        Tarea c=new Tarea(); c.setId(3L); c.setDependenciaIds(List.of(4L));
        Tarea d=new Tarea(); d.setId(4L);
        assertNull(DependenciaTareaRules.validar(1L,List.of(2L,3L),id->Optional.of(id==2?b:id==3?c:d)));
    }
    @Test void noPermiteRelacionConTareaDesactivada() {
        Tarea b=new Tarea(); b.setId(2L); b.setActivo(false);
        assertNotNull(DependenciaTareaRules.validar(1L,List.of(2L),id->Optional.of(b)));
    }
    @Test void redLargaNoDesbordaLaPila() {
        Map<Long,Tarea> porId = new HashMap<>();
        for (long id=2; id<=4001; id++) {
            Tarea tarea = new Tarea();
            tarea.setId(id);
            tarea.setDependenciaIds(id==4001 ? List.of() : List.of(id+1));
            porId.put(id,tarea);
        }
        assertNull(DependenciaTareaRules.validar(1L, List.of(2L),
                id -> Optional.ofNullable(porId.get(id))));
        porId.get(4001L).setDependenciaIds(List.of(1L));
        assertNotNull(DependenciaTareaRules.validar(1L, List.of(2L),
                id -> Optional.ofNullable(porId.get(id))));
    }

    @Test void rechazaArchivoHtmlCamuflado() {
        assertNull(EvidenciaArchivoRules.tipoPermitido("falso.png","<script>".getBytes()));
    }
    @Test void aceptaPdfConFirma() {
        assertEquals("application/pdf",EvidenciaArchivoRules.tipoPermitido("prueba.pdf","%PDF-1.7\n".getBytes()));
    }
    @Test void rechazaNombresConRutas() {
        assertNull(EvidenciaArchivoRules.tipoPermitido("../hola.pdf","%PDF-1.7\n".getBytes()));
    }
}
