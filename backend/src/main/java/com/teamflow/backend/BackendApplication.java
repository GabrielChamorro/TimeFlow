package com.teamflow.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ConfigurableApplicationContext;

import javax.sql.DataSource;
import java.sql.Connection;

@SpringBootApplication
public class BackendApplication {

    public static void main(String[] args) {
        final String VERDE = "\u001B[32m";
        final String ROJO = "\u001B[31m";
        final String AMARILLO = "\u001B[33m";
        final String RESET = "\u001B[0m";

        try {
            ConfigurableApplicationContext context = SpringApplication.run(BackendApplication.class, args);

            // Validación de conexión activa con MySQL
            boolean conexionValida = false;
            try {
                DataSource dataSource = context.getBean(DataSource.class);
                try (Connection conn = dataSource.getConnection()) {
                    conexionValida = conn.isValid(2);
                }
            } catch (Exception ex) {
                conexionValida = false;
            }

            if (conexionValida) {
                System.out.println(VERDE + "\n=============================================");
                System.out.println("INICIO BIEN");
                System.out.println("=============================================\n" + RESET);
            } else {
                System.out.println(AMARILLO + "\n=============================================");
                System.out.println("SERVIDOR INICIO PERO AHI PROBLEMAS");
                System.out.println("=============================================\n" + RESET);
            }

        } catch (Exception e) {
            System.err.println(ROJO + "\n=============================================");
            System.err.println("NO SE PUDO INICIAR POR UN ERROR: " + e.getMessage());
            System.err.println("=============================================\n" + RESET);
            System.exit(1); // Fallar explicitamente ante error de arranque (diagnostico de migracion).
        }
    }
}