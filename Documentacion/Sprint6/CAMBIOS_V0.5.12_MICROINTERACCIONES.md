# TimeFlow V0.5.12-SNAPSHOT — Microinteracciones

Base: V0.5.11-SNAPSHOT confirmada por el usuario.

## Cambios

- Transiciones sutiles de fondo, borde y respuesta al pulsar para botones de todas las pantallas, incluido el acceso.
- Indicador de pestaña activa y transición de entrada del contenido al navegar.
- Cierre con opacidad progresiva (150 ms) para el detalle de tareas, diálogo de demostración y confirmaciones administrativas.
- Apertura discreta de los formularios de usuarios y tipos de tarea; suavizado de cambios de listas y del chat.
- Indicadores de espera en actualización general, creación de tareas, guardado de tareas, usuarios, plantillas y registros de jornada.
- Foco visible para usuarios de teclado; compatibilidad con la preferencia de movimiento reducido.
- Se mantiene el movimiento directo del mapa y el arrastre de nodos sin animaciones nuevas que introduzcan retrasos.

## Prevención de pantalla en blanco

- Nuevo componente `frontend/src/components/MotionPresence.jsx` importado de forma explícita donde se usa.
- Pruebas `frontend/tests/microInteractions.test.mjs` para verificar imports relativos, función `buildDependencyCurve` y la constante `NODE_HEIGHT` donde corresponde.
- Comprobación sintáctica de todos los archivos de JS/JSX del frontend con TypeScript (solo análisis, no compilación).

## Límites de la validación

- En este entorno no están instaladas las dependencias del frontend (Vite / React), por lo que no se pudo ejecutar el build de producción ni las pruebas reales en navegador.
- No se ejecutó Maven ni una integración con MySQL; esta versión no cambia backend funcional ni base de datos.
- La animación de cierre no retrasa peticiones ni guardados; solo conserva visualmente diálogos durante 150 ms al cerrarse.
