// Medición sintética (CPU) de geometría y recorte del mapa.
// No mide FPS de React. Ejecutar: node scripts/benchmark_mapa.mjs
import { performance } from "node:perf_hooks";
import { createDefaultPositions, isNodeVisible, isEdgeVisible } from "../src/utils/mapLayout.js";

const iterations = 1500;
const viewport = { width: 1200, height: 640 };
const quantile = (sorted, q) => sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * q))];
for (const count of [100, 250, 500]) {
  const tasks = Array.from({ length: count }, (_, index) => ({ id: index + 1 }));
  const locations = createDefaultPositions(tasks);
  const nodes = tasks.map((task) => ({ ...task, ...locations[task.id] }));
  const times = [];
  let visibleNodes = 0;
  let visibleEdges = 0;
  for (let j = 0; j < iterations; j++) {
    const pan = { x: -((j * 27) % 1100), y: -((j * 17) % 900) };
    const start = performance.now();
    visibleNodes = 0;
    visibleEdges = 0;
    for (const task of nodes) if (isNodeVisible(task, pan, 0.85, viewport)) visibleNodes++;
    for (let i = 1; i < nodes.length; i++) {
      if (isEdgeVisible(nodes[i - 1], nodes[i], pan, 0.85, viewport)) visibleEdges++;
    }
    times.push(performance.now() - start);
  }
  times.sort((a, b) => a - b);
  console.log(`${count} nodos, ${iterations} iteraciones, mediana=${quantile(times, 0.5).toFixed(3)} ms, p95=${quantile(times, 0.95).toFixed(3)} ms, vista final=${visibleNodes} nodos y ${visibleEdges} conexiones`);
}
console.log("Nota: medición sintética de cálculos. No demuestra FPS ni tiempos de respuesta de TimeFlow.");
