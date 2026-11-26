// Cálculos puros para el monitoreo. Se prueban con Node sin navegador.
export const NODE_WIDTH = 192;
export const NODE_HEIGHT = 204; // Altura de reserva: incluye etiquetas de dependencia y estado.

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function getEdgeAnchors(previous, task) {
  const goRight = task.x >= previous.x;
  return {
    startX: previous.x + (goRight ? NODE_WIDTH : 0),
    startY: previous.y + NODE_HEIGHT / 2,
    endX: task.x + (goRight ? 0 : NODE_WIDTH),
    endY: task.y + NODE_HEIGHT / 2,
  };
}

export function buildDependencyCurve(previous, task) {
  const { startX, startY, endX, endY } = getEdgeAnchors(previous, task);
  const dx = endX - startX;
  const dy = endY - startY;
  const direction = dx >= 0 ? 1 : -1;
  const curveX = clamp(Math.abs(dx) * 0.34, 68, 180);
  const curveY = clamp(Math.abs(dy) * 0.16, 14, 54);

  const p0 = { x: startX, y: startY };
  const p1 = { x: startX + curveX * direction, y: startY + Math.sign(dy || 1) * curveY };
  const p2 = { x: endX - curveX * direction, y: endY - Math.sign(dy || 1) * curveY };
  const p3 = { x: endX, y: endY };

  return {
    d: `M ${p0.x} ${p0.y} C ${p1.x} ${p1.y}, ${p2.x} ${p2.y}, ${p3.x} ${p3.y}`,
    p0,
    p1,
    p2,
    p3,
    endX,
    endY,
  };
}


// Los datos nuevos usan dependenciaIds; se leen IDs antiguos solo si alguna
// prueba/fixture del frontend todavía entrega un objeto V0.5.7.
export function getDependencyIds(task) {
  if (Array.isArray(task?.dependenciaIds)) return [...new Set(task.dependenciaIds.filter(id => id != null && id !== '').map(String))];
  return task?.dependenciaId == null || task.dependenciaId === '' ? [] : [String(task.dependenciaId)];
}

export function dependencyChainIds(taskId, tasks) {
  const byId = new Map(tasks.map(t => [String(t.id), t]));
  const ids = new Set();
  const pending = [...getDependencyIds(byId.get(String(taskId)))];
  while (pending.length) {
    const id = pending.pop();
    if (id === String(taskId) || ids.has(id) || !byId.has(id)) continue;
    ids.add(id);
    pending.push(...getDependencyIds(byId.get(id)));
  }
  return ids;
}

export function wouldCreateCycle(taskId, proposedIds, tasks) {
  const ids = Array.isArray(proposedIds) ? proposedIds : [proposedIds];
  return ids.some(id => id != null && id !== '' &&
    (String(taskId) === String(id) || dependencyChainIds(id, tasks).has(String(taskId))));
}

const sortedById = (tasks) => [...tasks].sort((a,b) => {
  const aNum=Number(a.id), bNum=Number(b.id);
  if (Number.isFinite(aNum) && Number.isFinite(bNum)) return aNum-bNum;
  return String(a.id).localeCompare(String(b.id));
});

export function createDependencyEdges(tasks) {
  const ordered = sortedById(tasks);
  const byId = new Map(ordered.map(t => [String(t.id), t]));
  return ordered.flatMap((task,index) => {
    const deps = getDependencyIds(task);
    if (deps.length) return deps.flatMap(id => {
      const parent = byId.get(id);
      return parent && id !== String(task.id)
        ? [{ parentId: id, taskId: String(task.id), explicit: true }] : [];
    });
    const parent = index > 0 ? ordered[index-1] : null;
    return parent ? [{ parentId: String(parent.id), taskId: String(task.id), explicit: false }] : [];
  });
}

export function createDefaultPositions(tasks) {
  const ordered = sortedById(tasks);
  const result = {};
  if (!ordered.some(t => getDependencyIds(t).length)) {
    ordered.forEach((task,index) => {
      result[String(task.id)] = { x: 110 + (index % 10) * 228, y: 110 + Math.floor(index / 10) * 232 };
    });
    return result;
  }
  // Un nodo con varias dependencias va a la derecha de la más profunda.
  const byId = new Map(ordered.map(t => [String(t.id),t]));
  // Recorrido topológico iterativo: las cadenas largas no agotan la pila ni
  // pierden la dirección a partir del antiguo límite de 50 niveles.
  const depths = new Map(ordered.map(t => [String(t.id), 0]));
  const remaining = new Map();
  const children = new Map(ordered.map(t => [String(t.id), []]));
  for (const task of ordered) {
    const id = String(task.id);
    const parents = getDependencyIds(task).filter(parent => byId.has(parent));
    remaining.set(id, parents.length);
    for (const parent of parents) children.get(parent).push(id);
  }
  const queue = [...remaining.keys()].filter(id => remaining.get(id) === 0);
  for (let i = 0; i < queue.length; i++) {
    const id = queue[i];
    for (const child of children.get(id)) {
      depths.set(child, Math.max(depths.get(child), depths.get(id) + 1));
      remaining.set(child, remaining.get(child) - 1);
      if (remaining.get(child) === 0) queue.push(child);
    }
  }
  // Si llegan datos heredados con ciclos, mostrar las tarjetas sigue siendo
  // posible; la autoorganización explícita conserva su rechazo de ciclos.
  const counts = new Map();
  ordered.forEach(t => {
    const d = depths.get(String(t.id));
    const row = counts.get(d) || 0;
    counts.set(d, row+1);
    result[String(t.id)] = { x: 110+d*252, y: 110+row*232 };
  });
  return result;
}

export function isNodeVisible(task, pan, zoom, size, margin = 140) {
  if (!size.width || !size.height) return true;
  const left = task.x * zoom + pan.x;
  const top = task.y * zoom + pan.y;
  const width = NODE_WIDTH * zoom;
  const height = NODE_HEIGHT * zoom;
  return left + width >= -margin && top + height >= -margin
    && left <= size.width + margin && top <= size.height + margin;
}

export function isEdgeVisible(a, b, pan, zoom, size, margin = 140) {
  if (!size.width || !size.height) return true;
  const x1 = (a.x + NODE_WIDTH / 2) * zoom + pan.x;
  const y1 = (a.y + 35) * zoom + pan.y;
  const x2 = (b.x + NODE_WIDTH / 2) * zoom + pan.x;
  const y2 = (b.y + 35) * zoom + pan.y;
  return Math.max(x1, x2) >= -margin && Math.min(x1, x2) <= size.width + margin
    && Math.max(y1, y2) >= -margin && Math.min(y1, y2) <= size.height + margin;
}

export function fitNodes(tasks, size, padding = 46) {
  if (!tasks.length || !size.width || !size.height) return { zoom: 0.85, pan: { x: 0, y: 0 } };
  const minX = Math.min(...tasks.map((task) => task.x));
  const minY = Math.min(...tasks.map((task) => task.y));
  const maxX = Math.max(...tasks.map((task) => task.x + NODE_WIDTH));
  const maxY = Math.max(...tasks.map((task) => task.y + NODE_HEIGHT));
  const contentWidth = Math.max(1, maxX - minX);
  const contentHeight = Math.max(1, maxY - minY);
  const availableWidth = Math.max(1, size.width - padding * 2);
  const availableHeight = Math.max(1, size.height - padding * 2);
  const zoom = Math.min(2.5, Math.max(0.15,
    Math.min(availableWidth / contentWidth, availableHeight / contentHeight)));
  return {
    zoom,
    pan: {
      x: (size.width - contentWidth * zoom) / 2 - minX * zoom,
      y: (size.height - contentHeight * zoom) / 2 - minY * zoom,
    },
  };
}

// Organización explícita del administrador: dependencias primero, fecha límite
// después y menor cruce entre tareas con la misma fecha. No modifica los datos.
const AUTO_X_STEP = 292;
const AUTO_Y_STEP = 256; // Reserva para tarjetas con etiquetas y resaltado.
const AUTO_MAX_ROWS = 10;

function deadlineForSort(task) {
  let value = task.fechaLimite;
  if (typeof value !== 'string' || !value.trim()) return Number.POSITIVE_INFINITY;
  value = value.trim();
  if (/^\d{2}:\d{2}$/.test(value)) {
    const date = String(task.fecha || '');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return Number.POSITIVE_INFINITY;
    value = `${date}T${value}`;
  }
  // Solo se admiten fechas comparables; nunca se usa la hora local del navegador
  // para ordenar un valor sin zona horaria.
  const match = value.match(/^(\d{4}-\d{2}-\d{2})(?:T(\d{2}:\d{2})(?::\d{2})?)?/);
  if (!match) return Number.POSITIVE_INFINITY;
  const timestamp = Date.parse(`${match[1]}T${match[2] || '23:59'}:00Z`);
  return Number.isFinite(timestamp) ? timestamp : Number.POSITIVE_INFINITY;
}

function compareIds(a, b) {
  const aNum = Number(a);
  const bNum = Number(b);
  if (Number.isFinite(aNum) && Number.isFinite(bNum) && aNum !== bNum) return aNum - bNum;
  return String(a).localeCompare(String(b));
}

export function createAutoLayout(tasks) {
  if (!Array.isArray(tasks)) throw new Error('No se pudo leer la lista de tareas.');
  const byId = new Map();
  for (const task of tasks) {
    if (task?.id == null) throw new Error('Se encontró una tarea sin identificador.');
    const id = String(task.id);
    if (byId.has(id)) throw new Error('El mapa contiene identificadores de tarea repetidos.');
    byId.set(id, task);
  }
  const ids = [...byId.keys()].sort(compareIds);
  const parents = new Map(ids.map(id => [id, []]));
  const children = new Map(ids.map(id => [id, []]));
  const remaining = new Map(ids.map(id => [id, 0]));
  const depth = new Map(ids.map(id => [id, 0]));
  for (const id of ids) {
    for (const parentId of getDependencyIds(byId.get(id))) {
      // Las referencias a tareas desactivadas no se vuelven a conectar ni se inventan.
      if (!byId.has(parentId)) continue;
      if (parentId === id) throw new Error('Se encontró una dependencia circular.');
      parents.get(id).push(parentId);
      children.get(parentId).push(id);
      remaining.set(id, remaining.get(id) + 1);
    }
  }

  const queue = ids.filter(id => remaining.get(id) === 0);
  for (let i = 0; i < queue.length; i += 1) {
    const current = queue[i];
    for (const child of children.get(current)) {
      depth.set(child, Math.max(depth.get(child), depth.get(current) + 1));
      remaining.set(child, remaining.get(child) - 1);
      if (remaining.get(child) === 0) queue.push(child);
    }
  }
  if (queue.length !== ids.length) {
    throw new Error('Las tareas contienen un ciclo de dependencias. Corrígelo antes de autoorganizarlas.');
  }

  const groups = [];
  for (const id of ids) {
    const level = depth.get(id);
    if (!groups[level]) groups[level] = [];
    groups[level].push(id);
  }
  const orderInGroup = new Map();
  const sortedGroups = groups.map(group => {
    const sorted = [...group].sort((a, b) => {
      const dateA = deadlineForSort(byId.get(a));
      const dateB = deadlineForSort(byId.get(b));
      if (dateA !== dateB) return dateA < dateB ? -1 : 1;
      const score = id => {
        const list = parents.get(id);
        if (!list.length) return Number.POSITIVE_INFINITY;
        const orderedParents = list.filter(parent => orderInGroup.has(parent));
        return orderedParents.length
          ? orderedParents.reduce((sum, parent) => sum + orderInGroup.get(parent), 0) / orderedParents.length
          : Number.POSITIVE_INFINITY;
      };
      const leftScore = score(a);
      const rightScore = score(b);
      if (leftScore !== rightScore) return leftScore - rightScore;
      return compareIds(a, b);
    });
    sorted.forEach((id, index) => orderInGroup.set(id, index));
    return sorted;
  });

  const positions = {};
  let xOffset = 110;
  const widestRowCount = Math.max(1, ...sortedGroups.map(group => Math.min(group.length, AUTO_MAX_ROWS)));
  for (const group of sortedGroups) {
    const columns = Math.ceil(group.length / AUTO_MAX_ROWS);
    for (let index = 0; index < group.length; index += 1) {
      const col = Math.floor(index / AUTO_MAX_ROWS);
      const row = index % AUTO_MAX_ROWS;
      const usedRows = Math.min(AUTO_MAX_ROWS, group.length - col * AUTO_MAX_ROWS);
      positions[group[index]] = {
        x: xOffset + col * AUTO_X_STEP,
        y: Math.round(110 + (widestRowCount - usedRows) * AUTO_Y_STEP / 2 + row * AUTO_Y_STEP),
      };
    }
    xOffset += columns * AUTO_X_STEP;
  }
  return {
    positions,
    levels: sortedGroups.length,
    total: ids.length,
    relations: [...parents.values()].reduce((sum, list) => sum + list.length, 0),
  };
}
