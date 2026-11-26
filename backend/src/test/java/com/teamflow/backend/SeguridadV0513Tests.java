package com.teamflow.backend;

import com.teamflow.backend.security.EvidenciaArchivoRules;
import com.teamflow.backend.security.LoginAttemptLimiter;
import org.junit.jupiter.api.Test;
import java.io.ByteArrayOutputStream;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;
import static org.junit.jupiter.api.Assertions.*;

class SeguridadV0513Tests {
    @Test void evitaAtaquesQuePruebanMuchosCorreosDesdeLaMismaIp() {
        LoginAttemptLimiter limitador = new LoginAttemptLimiter();
        for (int i = 0; i < 30; i++) {
            assertFalse(limitador.bloqueado("persona" + i + "@example.test", "192.0.2.50"));
            limitador.registrarFallo("persona" + i + "@example.test", "192.0.2.50");
        }
        assertTrue(limitador.bloqueado("persona31@example.test", "192.0.2.50"));
        assertFalse(limitador.bloqueado("persona31@example.test", "192.0.2.51"));
        // Entrar correctamente a una cuenta no reinicia el límite general por IP.
        limitador.registrarExito("persona0@example.test", "192.0.2.50");
        assertTrue(limitador.bloqueado("persona0@example.test", "192.0.2.50"));
    }

    private byte[] zipConEntradas(String... rutas) throws Exception {
        ByteArrayOutputStream salida = new ByteArrayOutputStream();
        try (ZipOutputStream zip = new ZipOutputStream(salida)) {
            for (String ruta : rutas) {
                zip.putNextEntry(new ZipEntry(ruta));
                zip.write("<document/>".getBytes(java.nio.charset.StandardCharsets.UTF_8));
                zip.closeEntry();
            }
        }
        return salida.toByteArray();
    }

    @Test void noAceptaArchivoZipRenombradoComoDocx() throws Exception {
        assertNull(EvidenciaArchivoRules.tipoPermitido("fraude.docx", zipConEntradas("word/document.xml")));
    }

    @Test void aceptaEstructuraBasicaDeDocx() throws Exception {
        byte[] archivo = zipConEntradas("[Content_Types].xml", "_rels/.rels", "word/document.xml");
        assertEquals("application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                EvidenciaArchivoRules.tipoPermitido("informe.docx", archivo));
    }

    @Test void rechazaDocxConRutaDeEscape() throws Exception {
        byte[] archivo = zipConEntradas("[Content_Types].xml", "_rels/.rels", "word/document.xml", "../secreto.txt");
        assertNull(EvidenciaArchivoRules.tipoPermitido("informe.docx", archivo));
    }

    @Test void rechazaDocxConExpansionExcesiva() throws Exception {
        ByteArrayOutputStream salida = new ByteArrayOutputStream();
        try (ZipOutputStream zip = new ZipOutputStream(salida)) {
            for (String ruta : new String[]{"[Content_Types].xml", "_rels/.rels", "word/document.xml"}) {
                zip.putNextEntry(new ZipEntry(ruta));
                if (ruta.equals("word/document.xml")) {
                    byte[] ceros = new byte[1024*1024];
                    for (int i=0;i<129;i++) zip.write(ceros);
                } else zip.write("ok".getBytes());
                zip.closeEntry();
            }
        }
        assertNull(EvidenciaArchivoRules.tipoPermitido("bomba.docx", salida.toByteArray()));
    }
}
