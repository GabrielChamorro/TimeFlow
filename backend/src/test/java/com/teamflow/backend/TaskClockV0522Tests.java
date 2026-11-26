package com.teamflow.backend;
import com.teamflow.backend.models.Tarea;
import com.teamflow.backend.services.TaskClockRules;
import tools.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class TaskClockV0522Tests {
    Tarea nueva(long now) { var t=new Tarea(); TaskClockRules.iniciar(t,now); return t; }
    void estado(Tarea t,String state,boolean active,long now) { TaskClockRules.transicionar(t,state,active,now);t.setEstado(state);t.setActivo(active); }
    @Test void tresTareasNoCompartenAnclas() {
        var a=nueva(1000);var b=nueva(2000);var c=nueva(4000);
        estado(b,"En Revisión",true,5000);
        assertEquals(1000L,a.getTiempoInicioMs());assertEquals(3000L,b.getTiempoAcumuladoMs());assertNull(b.getTiempoInicioMs());assertEquals(4000L,c.getTiempoInicioMs());
    }
    @Test void revisionNoAcumulaRechazoReanudaYFinalizacionDetiene() {
        var t=nueva(1000);estado(t,"En Revisión",true,5000);estado(t,"En Progreso",true,10000);
        assertEquals(4000L,t.getTiempoAcumuladoMs());assertEquals(10000L,t.getTiempoInicioMs());
        estado(t,"Finalizada",true,12000);assertEquals(6000L,t.getTiempoAcumuladoMs());assertNull(t.getTiempoInicioMs());
        estado(t,"Finalizada",false,50000);assertEquals(6000L,t.getTiempoAcumuladoMs());
    }
    @Test void editarEnMismoEstadoNoReiniciaElSegmento() {
        var t=nueva(1000);estado(t,"En Progreso",true,9000);assertEquals(0L,t.getTiempoAcumuladoMs());assertEquals(1000L,t.getTiempoInicioMs());
    }
    @Test void desactivacionPausaYReactivacionNoCuentaLaBaja() {
        var t=nueva(1000);estado(t,"En Progreso",false,3000);estado(t,"En Progreso",true,9000);
        assertEquals(2000L,t.getTiempoAcumuladoMs());assertEquals(9000L,t.getTiempoInicioMs());
    }
    @Test void legadoNoRecibeDuracionInventada() {
        var t=new Tarea();t.setFechaInicio("08:00");estado(t,"En Revisión",true,2000);estado(t,"En Progreso",true,9000);
        assertNull(t.getTiempoAcumuladoMs());assertNull(t.getTiempoInicioMs());
    }
    @Test void ajusteServidorHaciaAtrasNoProduceNegativos() {
        var t=nueva(5000);estado(t,"En Revisión",true,2000);assertEquals(0L,t.getTiempoAcumuladoMs());
    }
    @Test void clienteNoPuedeInyectarNiReiniciarLosCamposTemporales() throws Exception {
        var mapper=new ObjectMapper();var t=mapper.readValue("{\"tiempoAcumuladoMs\":999,\"tiempoInicioMs\":1,\"ultimoRegistroId\":77}",Tarea.class);
        assertNull(t.getTiempoAcumuladoMs());assertNull(t.getTiempoInicioMs());assertNull(t.getUltimoRegistroId());
        TaskClockRules.iniciar(t,5000);var json=mapper.readTree(mapper.writeValueAsString(t));assertEquals(5000,json.get("tiempoInicioMs").asLong());
    }
}
