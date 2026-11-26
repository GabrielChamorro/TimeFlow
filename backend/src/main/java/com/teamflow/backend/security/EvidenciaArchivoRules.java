package com.teamflow.backend.security;

import java.util.Locale;
import java.util.Map;

/** Valida extension, contenido y tamaño sin confiar en el MIME del navegador. */
public final class EvidenciaArchivoRules {
    public static final int MAX_BYTES = 60 * 1024 * 1024;
    public static final long MAX_BYTES_POR_TAREA = 300L * 1024L * 1024L;

    public static boolean tamanoValido(long bytes) {
        return bytes > 0 && bytes <= MAX_BYTES;
    }
    private static final Map<String, String> TIPOS = Map.ofEntries(
        Map.entry("png", "image/png"), Map.entry("jpg", "image/jpeg"),
        Map.entry("jpeg", "image/jpeg"), Map.entry("gif", "image/gif"),
        Map.entry("webp", "image/webp"), Map.entry("pdf", "application/pdf"),
        Map.entry("docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
        Map.entry("txt", "text/plain"), Map.entry("mp4", "video/mp4"),
        Map.entry("webm", "video/webm")
    );
    private EvidenciaArchivoRules() {}
    public static String tipoPermitido(String nombre, byte[] bytes) {
        if (nombre == null || bytes == null || !tamanoValido(bytes.length)) return null;
        String base = nombre.replace('\\', '/');
        if (base.contains("/") || base.contains("..") || base.length() > 200 || base.chars().anyMatch(Character::isISOControl)) return null;
        int punto = base.lastIndexOf('.');
        if (punto < 1) return null;
        String ext = base.substring(punto + 1).toLowerCase(Locale.ROOT);
        String mime = TIPOS.get(ext);
        if (mime == null) return null;
        boolean firma = switch (ext) {
            case "png" -> prefijo(bytes, 0, 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A);
            case "jpg", "jpeg" -> prefijo(bytes, 0, 0xFF, 0xD8, 0xFF);
            case "gif" -> prefijo(bytes, 0, 'G', 'I', 'F', '8');
            case "webp" -> prefijo(bytes, 0, 'R', 'I', 'F', 'F') && prefijo(bytes, 8, 'W', 'E', 'B', 'P');
            case "pdf" -> prefijo(bytes, 0, '%', 'P', 'D', 'F', '-');
            case "docx" -> prefijo(bytes, 0, 'P', 'K', 3, 4) && esDocx(bytes);
            case "mp4" -> prefijo(bytes, 4, 'f', 't', 'y', 'p');
            case "webm" -> prefijo(bytes, 0, 0x1A, 0x45, 0xDF, 0xA3);
            case "txt" -> esTexto(bytes);
            default -> false;
        };
        return firma ? mime : null;
    }
    private static boolean prefijo(byte[] b, int offset, int... expected) {
        if (b.length < offset + expected.length) return false;
        for (int i = 0; i < expected.length; i++) if ((b[offset+i] & 0xFF) != expected[i]) return false;
        return true;
    }
    private static boolean esTexto(byte[] b) {
        for (byte v : b) if (v == 0) return false;
        try { java.nio.charset.StandardCharsets.UTF_8.newDecoder().decode(java.nio.ByteBuffer.wrap(b)); return true; }
        catch (java.nio.charset.CharacterCodingException ex) { return false; }
    }
    private static boolean esDocx(byte[] b) {
        // Una firma ZIP por sí sola no garantiza que el documento sea seguro.
        // Acotar la cantidad de entradas y los bytes descomprimidos previene bombas ZIP.
        final long maxDescomprimidos = 128L * 1024 * 1024;
        final int maxEntradas = 2048;
        boolean contenido = false;
        boolean tipos = false;
        boolean relaciones = false;
        long total = 0;
        byte[] buffer = new byte[8192];
        try (java.util.zip.ZipInputStream zip = new java.util.zip.ZipInputStream(new java.io.ByteArrayInputStream(b))) {
            java.util.zip.ZipEntry entry;
            int count = 0;
            while ((entry = zip.getNextEntry()) != null) {
                if (++count > maxEntradas) return false;
                String nombre = entry.getName();
                if (nombre == null || nombre.startsWith("/") || nombre.contains("\\")
                        || nombre.equals("..") || nombre.startsWith("../") || nombre.contains("/../")) return false;
                if ("word/document.xml".equals(nombre)) contenido = true;
                if ("[Content_Types].xml".equals(nombre)) tipos = true;
                if ("_rels/.rels".equals(nombre)) relaciones = true;
                int leidos;
                while ((leidos = zip.read(buffer)) != -1) {
                    total += leidos;
                    if (total > maxDescomprimidos) return false;
                }
                zip.closeEntry();
            }
        } catch (java.io.IOException | IllegalArgumentException ignored) {
            return false;
        }
        return contenido && tipos && relaciones;
    }
}
