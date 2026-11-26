# Revisión del repositorio para Sprint 7

Fecha: 26 de noviembre de 2026.

## Versión preparada

Se actualizó la versión 0.5.0 del repositorio a las fuentes V0.5.23-SNAPSHOT incluidas en `TimeFlow_V0.5.23_Backend_Frontend_Ordenados.zip`. Se mantuvo la organización del paquete con backend y frontend separados, los SQL y los auxiliares en sus carpetas correspondientes.

Se incorporaron el manual de usuario de 23 páginas, el plan del Sprint 7 y el informe de cierre del Sprint 6. El README describe el instalador principal y el inicio de ambos servidores. No se incorporó el PDF anterior del manual porque no corresponde a la última revisión.

## Comprobaciones realizadas en esta actualización

| Comprobación | Resultado |
| --- | --- |
| Pruebas del frontend con `node --test tests/*.test.mjs` | 112 aprobadas, sin fallos |
| Compilación del frontend con `npm run build` | Correcta, Vite 8.2.6 |
| Pruebas del backend con `mvnw.cmd -o test` | 169 aprobadas, sin fallos ni errores |
| Revisión de enlaces locales del README | Destinos presentes |
| Comparación del manual incluido | Idéntico al Word actualizado del trabajo del Sprint 7 |
| Revisión de archivos a publicar | Sin configuración local privada, dependencias descargadas, JAR, dist ni target |
| Búsqueda de firmas de claves y tokens en los archivos a publicar | Sin coincidencias con los patrones revisados |

Las pruebas utilizaron Node.js 24.22.3 y Java 21.0.12.1 disponibles en el entorno de revisión. Esta ejecución de pruebas no cambia la comprobación de parches de Java y MySQL que realiza el instalador del proyecto.

No se ejecutó el instalador completo ni se hicieron operaciones sobre una base de datos real. Las pruebas automáticas del backend utilizaron sus dobles de prueba. Esta revisión no sustituye la comprobación manual de instalación, el ensayo de la defensa ni la aceptación completa del Sprint 7.

## Archivos conservados y excluidos

Se conservaron las evidencias históricas del ZIP que no están excluidas por las reglas de Git. Sus fechas, resultados y estados corresponden a las ejecuciones originales.

Se excluyen las compilaciones y las dependencias que se regeneran desde las fuentes. Las configuraciones privadas y los respaldos permanecen fuera del repositorio. El manual no contiene contraseñas de acceso y los ejemplos permitidos de entorno no contienen claves reales.
