package com.teamflow.backend;
import com.teamflow.backend.security.*;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
class SeguridadV0520Tests {
    @Test void solicitudesParalelasNoSuperanOchoReservasAntesDeVerificarClaves() throws Exception {
        var limiter=new LoginAttemptLimiter();var admitted=new AtomicInteger();
        try(var pool=Executors.newFixedThreadPool(32)) {
            var start=new CountDownLatch(1);var futures=new java.util.ArrayList<Future<?>>();
            for(int i=0;i<32;i++) futures.add(pool.submit(()->{start.await();if(limiter.admitir("test@local.test","192.0.2.20"))admitted.incrementAndGet();return null;}));
            start.countDown();for(var f:futures)f.get();
        }
        assertEquals(8,admitted.get());assertTrue(limiter.bloqueado("test@local.test","192.0.2.20"));
    }
    @Test void loginsCorrectosNoConsumenElLimiteDeFallosPorIp() {
        var limiter=new LoginAttemptLimiter();
        for(int i=0;i<100;i++) {assertTrue(limiter.admitir("test@local.test","192.0.2.21"));limiter.registrarExitoReservado("test@local.test","192.0.2.21");}
        assertFalse(limiter.bloqueado("test@local.test","192.0.2.21"));
    }
    @Test void mantenimientoEliminaSoloCaducadosDeFormaAcotadaYToleraCaidas() {
        var jdbc=mock(JdbcTemplate.class);var maintenance=new SessionMaintenance(jdbc);
        maintenance.cleanExpired();verify(jdbc).update(eq("DELETE FROM sesiones_jwt WHERE expires_at_ms <= ? LIMIT 1000"),anyLong());
        when(jdbc.update(anyString(),anyLong())).thenThrow(new org.springframework.dao.DataAccessResourceFailureException("privado"));
        assertDoesNotThrow(maintenance::cleanExpired);
    }
}
