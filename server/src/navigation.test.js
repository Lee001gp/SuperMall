import test from 'node:test';
import assert from 'node:assert/strict';
import { shortestPath, planRoute } from './navigation.js';

test('shortestPath returns shortest route and eta', () => {
  const graph = { nodes: ['a', 'b', 'c'], edges: [['a', 'b', 5], ['b', 'c', 7], ['a', 'c', 20]] };
  const route = shortestPath(graph, 'a', 'c');
  assert.deepEqual(route.path, ['a', 'b', 'c']);
  assert.equal(route.distance, 12);
});

test('accessible routing avoids stairs-only edges', () => {
  const graph = {
    nodes: ['entry', 'stairs', 'lift', 'store'],
    edges: [
      ['entry', 'stairs', 5, { stairsOnly: true }],
      ['stairs', 'store', 5, { stairsOnly: true }],
      ['entry', 'lift', 8],
      ['lift', 'store', 8]
    ]
  };
  const route = planRoute(graph, 'entry', 'store', 'accessible');
  assert.deepEqual(route.path, ['entry', 'lift', 'store']);
});
