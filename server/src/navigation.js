/**
 * Indoor navigation utilities.
 * Provides shortest-route computation and route option selection for accessible routes.
 */

export function shortestPath(graph, start, end, blockedEdges = new Set()) {
  const distances = new Map();
  const previous = new Map();
  const unvisited = new Set(graph.nodes);

  for (const node of graph.nodes) distances.set(node, Infinity);
  distances.set(start, 0);

  while (unvisited.size) {
    let current = null;
    for (const node of unvisited) {
      if (!current || distances.get(node) < distances.get(current)) current = node;
    }
    if (!current || current === end || distances.get(current) === Infinity) break;
    unvisited.delete(current);

    for (const [a, b, weight, options = {}] of graph.edges) {
      const edgeKey = `${a}:${b}`;
      if (blockedEdges.has(edgeKey)) continue;
      const neighbor = a === current ? b : b === current ? a : null;
      if (!neighbor || !unvisited.has(neighbor)) continue;
      const alt = distances.get(current) + weight + (options.penalty || 0);
      if (alt < distances.get(neighbor)) {
        distances.set(neighbor, alt);
        previous.set(neighbor, current);
      }
    }
  }

  const path = [];
  let cursor = end;
  while (cursor) {
    path.unshift(cursor);
    cursor = previous.get(cursor);
  }
  const distance = distances.get(end);
  return { path, distance, etaMinutes: Number.isFinite(distance) ? Math.ceil(distance / 70) : null };
}

export function planRoute(graph, from, to, mode = 'standard') {
  const blocked = new Set();
  if (mode === 'accessible') {
    // Example: avoid stairs edge label if graph declares it.
    for (const [a, b, _w, options = {}] of graph.edges) {
      if (options.stairsOnly) blocked.add(`${a}:${b}`);
    }
  }
  return shortestPath(graph, from, to, blocked);
}
