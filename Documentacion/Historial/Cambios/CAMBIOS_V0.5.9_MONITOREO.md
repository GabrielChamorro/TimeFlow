# TimeFlow V0.5.9-SNAPSHOT — corrección del Monitoreo Espacial

## Error corregido

En V0.5.8, al abrir Monitoreo Espacial con el backend conectado y tareas con
relaciones de dependencia reales, podía aparecer una pantalla blanca.

**Causa confirmada en el código:** `MonitoringView.jsx` usaba `NODE_HEIGHT`
para calcular el origen y destino de las flechas SVG sin tener esa constante
importada. La ejecución de `buildDependencyCurve()` disparaba un
`ReferenceError` cuando había aristas explícitas.

## Solución

- Se trasladó `buildDependencyCurve` y la geometría de anclaje a
  `frontend/src/utils/mapLayout.js`, donde `NODE_WIDTH` y `NODE_HEIGHT`
  ya están definidos.
- `MonitoringView.jsx` importa la función y conserva las flechas curvas,
  cheurones y bordes animados de la versión anterior.
- Se agregaron 3 pruebas de regresión en
  `frontend/tests/dependencyCurves.test.mjs` con dependencias múltiples.
- Se actualizó la versión en `frontend/package.json`, `package-lock.json`
  y `backend/pom.xml`.
- Se simplificó la comprobación visual del JDK en `backend/iniciar_servidor.bat`
  para evitar el comando de Windows con comillas y tuberías que podía mostrar
  un aviso de sintaxis sin impedir el arranque. Se actualizaron los títulos de
  los scripts de inicio. Esta mejora requiere verificación en Windows.

## Cómo aplicar

1. Cerrar frontend y backend.
2. Sustituir los archivos indicados en el parche, o descomprimir el proyecto completo.
3. **No ejecutar migración SQL adicional:** la base de datos de V0.5.8 es compatible.
4. Desde `frontend` ejecutar `npm ci` (si no están instaladas las dependencias)
   y `npm run dev`.
5. Iniciar backend como de costumbre y abrir Monitoreo Espacial con varias
   dependencias. Comprobar que los nodos y conexiones se dibujen.
6. Ejecutar `npm run test:sprint5` y `npm run build` en Windows.

## Comprobaciones de esta entrega

- Pruebas automáticas de Node: **38/38 aprobadas** (35 anteriores + 3 nuevas).
- Archivo JSX `MonitoringView.jsx` verificado sintácticamente con TypeScript.
- La compilación integrada de Vite, la ejecución real en Brave, el backend
  completo y la conexión a MySQL **no se han podido comprobar aquí**.
- El aviso de Windows sobre sintaxis de una etiqueta del .bat es independiente
  del fallo del mapa; el log compartido muestra que el backend inició y conectó
  con MySQL.
