package com.teamflow.backend.security;

import org.springframework.stereotype.Component;
import java.time.Clock;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.Map;

/** Límite local de intentos incorrectos por IP + correo, sin almacenar claves. */
@Component
public final class LoginAttemptLimiter {
    static final int MAX_FAILURES = 8;
    static final long WINDOW_MS = 15L * 60 * 1000;
    private static final int MAX_KEYS = 5000;
    // Reduce ataques que cambian de correo en cada intento desde la misma IP.
    static final int MAX_FAILURES_PER_IP = 30;

    private final Clock clock;
    private final Map<String, Entry> entries = new LinkedHashMap<>();
    private final Map<String, Entry> ipEntries = new LinkedHashMap<>();
    private record Entry(int failures, long expiresAt) {}

    public LoginAttemptLimiter() { this(Clock.systemUTC()); }
    LoginAttemptLimiter(Clock clock) { this.clock = clock; }

    private String key(String email, String ip) {
        return (ip == null ? "sin-ip" : ip) + "|" + (email == null ? "" : email.trim().toLowerCase(java.util.Locale.ROOT));
    }

    public synchronized boolean bloqueado(String email, String ip) {
        return sobreLimite(entries, key(email, ip), MAX_FAILURES)
                || sobreLimite(ipEntries, ipKey(ip), MAX_FAILURES_PER_IP);
    }

    /** Reserva antes de BCrypt: comprobar y contar no pueden separarse entre hilos. */
    public synchronized boolean admitir(String email, String ip) {
        if (bloqueado(email, ip)) return false;
        incrementar(entries, key(email, ip), MAX_FAILURES);
        incrementar(ipEntries, ipKey(ip), MAX_FAILURES_PER_IP);
        return true;
    }

    public synchronized void registrarExitoReservado(String email, String ip) {
        registrarExito(email, ip);
        String key = ipKey(ip);
        Entry entry = ipEntries.get(key);
        if (entry != null) {
            if (entry.failures <= 1 || entry.expiresAt <= clock.millis()) ipEntries.remove(key);
            else ipEntries.put(key, new Entry(entry.failures - 1, entry.expiresAt));
        }
    }

    private String ipKey(String ip) {
        return ip == null || ip.isBlank() ? "sin-ip" : ip;
    }

    private boolean sobreLimite(Map<String, Entry> mapa, String clave, int maximo) {
        Entry entry = mapa.get(clave);
        if (entry == null) return false;
        if (entry.expiresAt <= clock.millis()) {
            mapa.remove(clave);
            return false;
        }
        return entry.failures >= maximo;
    }

    private void incrementar(Map<String, Entry> mapa, String clave, int maximo) {
        long now = clock.millis();
        Entry previous = mapa.get(clave);
        if (previous == null || previous.expiresAt <= now) {
            if (mapa.size() >= MAX_KEYS) {
                mapa.entrySet().removeIf(entry -> entry.getValue().expiresAt <= now);
                if (mapa.size() >= MAX_KEYS) {
                    Iterator<String> iter = mapa.keySet().iterator();
                    if (iter.hasNext()) { iter.next(); iter.remove(); }
                }
            }
            mapa.put(clave, new Entry(1, now + WINDOW_MS));
        } else {
            mapa.put(clave, new Entry(Math.min(maximo, previous.failures + 1), previous.expiresAt));
        }
    }

    public synchronized void registrarFallo(String email, String ip) {
        incrementar(entries, key(email, ip), MAX_FAILURES);
        incrementar(ipEntries, ipKey(ip), MAX_FAILURES_PER_IP);
    }

    public synchronized void registrarExito(String email, String ip) {
        entries.remove(key(email, ip));
    }
}
