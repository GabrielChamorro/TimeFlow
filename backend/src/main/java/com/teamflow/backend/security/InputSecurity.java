package com.teamflow.backend.security;

import java.net.URI;
import java.util.Base64;
import java.util.Locale;

public final class InputSecurity {

    public static final int MAX_EVIDENCE_BYTES = 2 * 1024 * 1024;
    public static final int MAX_EVIDENCE_TEXT = 2_900_000;

    private InputSecurity() {}

    public static String validarLongitud(String valor, int maximo, String campo) {
        if (valor != null && valor.length() > maximo) {
            return campo + " no puede superar " + maximo + " caracteres";
        }
        return null;
    }

    public static String validarEvidenciaImagen(String evidencia) {
        if (evidencia == null || evidencia.isBlank()) {
            return null;
        }
        if (evidencia.length() > MAX_EVIDENCE_TEXT) {
            return "La evidencia supera el tamaño máximo permitido de 2 MB";
        }

        String valor = evidencia.trim();
        if (valor.startsWith("https://")) {
            if (valor.length() > 2048) {
                return "La URL de evidencia es demasiado larga";
            }
            try {
                URI uri = URI.create(valor);
                if (!"https".equalsIgnoreCase(uri.getScheme()) || uri.getHost() == null) {
                    return "La URL de evidencia no es válida";
                }
                return null;
            } catch (IllegalArgumentException ex) {
                return "La URL de evidencia no es válida";
            }
        }

        int coma = valor.indexOf(',');
        if (coma <= 0) {
            return "La evidencia debe ser una imagen válida";
        }

        String cabecera = valor.substring(0, coma).toLowerCase(Locale.ROOT);
        String base64 = valor.substring(coma + 1);
        String tipo;
        if (cabecera.equals("data:image/png;base64")) {
            tipo = "png";
        } else if (cabecera.equals("data:image/jpeg;base64") || cabecera.equals("data:image/jpg;base64")) {
            tipo = "jpeg";
        } else if (cabecera.equals("data:image/gif;base64")) {
            tipo = "gif";
        } else if (cabecera.equals("data:image/webp;base64")) {
            tipo = "webp";
        } else {
            return "Solo se permiten imágenes PNG, JPG/JPEG, GIF o WEBP";
        }

        try {
            byte[] bytes = Base64.getDecoder().decode(base64);
            if (bytes.length == 0 || bytes.length > MAX_EVIDENCE_BYTES) {
                return "La evidencia supera el tamaño máximo permitido de 2 MB";
            }
            if (!firmaCoincide(bytes, tipo)) {
                return "El contenido de la evidencia no coincide con un formato de imagen permitido";
            }
        } catch (IllegalArgumentException ex) {
            return "La evidencia contiene datos Base64 no válidos";
        }
        return null;
    }

    private static boolean firmaCoincide(byte[] b, String tipo) {
        return switch (tipo) {
            case "png" -> b.length >= 8
                    && (b[0] & 0xFF) == 0x89 && b[1] == 0x50 && b[2] == 0x4E && b[3] == 0x47
                    && b[4] == 0x0D && b[5] == 0x0A && b[6] == 0x1A && b[7] == 0x0A;
            case "jpeg" -> b.length >= 3
                    && (b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8 && (b[2] & 0xFF) == 0xFF;
            case "gif" -> b.length >= 6
                    && b[0] == 'G' && b[1] == 'I' && b[2] == 'F'
                    && b[3] == '8' && (b[4] == '7' || b[4] == '9') && b[5] == 'a';
            case "webp" -> b.length >= 12
                    && b[0] == 'R' && b[1] == 'I' && b[2] == 'F' && b[3] == 'F'
                    && b[8] == 'W' && b[9] == 'E' && b[10] == 'B' && b[11] == 'P';
            default -> false;
        };
    }
}
