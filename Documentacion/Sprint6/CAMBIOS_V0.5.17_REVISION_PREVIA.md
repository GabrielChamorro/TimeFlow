# TimeFlow V0.5.17-SNAPSHOT — Revisión previa a pruebas del autoordenamiento

## Base de trabajo
Se revisó el ZIP original de V0.5.16 del proyecto completo. Se conservaron la autoorganización, las dependencias múltiples, las confirmaciones y las microinteracciones.

## Errores concretos corregidos
1. **Fallo en guardado manual:** el manejador del arrastre de nodos no capturaba excepciones inesperadas de la función de guardado. Ahora captura el error, devuelve el nodo a su última posición confirmada y muestra una advertencia.
2. **Arrastres simultáneos:** se podía iniciar un segundo arrastre mientras había otro pendiente. Se bloquean nuevos arrastres hasta que el primero termine; esto evita que respuestas desordenadas confundan las posiciones locales.
3. **Separación de nodos:** el cálculo del mapa reservaba 108 píxeles de altura, aunque la tarjeta puede ocupar bastante más por las etiquetas y textos. Se reserva una altura de 204 píxeles y se aumenta la separación vertical tanto en el mapa por defecto como al autoorganizar. Los conectores ajustan su punto de llegada a la nueva altura estimada.
4. **Validación de movimiento manual:** el endpoint individual de posición ahora rechaza coordenadas mayores a 10 millones en magnitud y cuerpos incompletos. El guardado conjunto ya aplicaba ese límite.
5. **Prueba de geometría obsoleta:** se corrigió una prueba que exigía encajar 100 tarjetas altas en un área vertical incompatible con la separación segura. La nueva prueba verifica directamente que no haya superposiciones.

## Pruebas ejecutadas en el entorno de revisión
- Frontend: **74/74** pruebas de Node superadas (69 previas + 5 nuevas).
- Sintaxis JS/JSX: **25 archivos** analizados con parser de TypeScript, sin errores.
- Importaciones relativas: **36 rutas** verificadas, todas existentes.
- Integridad de ZIP: comprobada durante la preparación.
- Añadidas dos pruebas JUnit del endpoint individual de posiciones; no ejecutadas aquí porque Maven y sus dependencias no están disponibles.

## Límites reales de la revisión
- `npm run build` no se pudo completar en este entorno: no hay Vite instalado (`vite: not found`).
- No se ejecutaron las pruebas Java/Spring Boot completas ni la operación concurrente real en MySQL.
- La altura de 204 px es una reserva aproximada según las etiquetas actuales; aún debe verificarse visualmente con los datos y tamaño de pantalla reales.
- Un fallo de red tras confirmar un lote debe contrastarse recargando las posiciones, ya que la respuesta puede perderse después de que el servidor haya guardado.

## Cómo probar en Windows
1. Conservar la carpeta original V0.5.16 como respaldo.
2. Descomprimir V0.5.17 en otra carpeta. No ejecutar nuevas migraciones de MySQL por estos cambios.
3. Iniciar frontend y backend de la misma versión; verificar la compilación antes de probar.
4. Comprobar autoorganización, vista previa, cancelar, aplicar y persistencia tras recarga; probar con múltiples dependencias y varias tareas en el mismo nivel.
5. Desconectar el backend durante un arrastre para verificar que la posición vuelve a su estado anterior.
6. Ejecutar `npm run test:sprint5`, `npm run build` y `backend/mvnw.cmd test` en Windows.

**Estado:** V0.5.17-SNAPSHOT, lista para pruebas locales controladas; no certificada con MySQL real.
