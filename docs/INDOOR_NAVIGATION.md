# Indoor Navigation

Each mall owns a tenant-scoped graph in `state.mapGraph`:
- nodes: entrances, stores, food courts, parking anchors
- weighted edges in meters
- optional edge metadata (`stairsOnly`) for accessible planning

Algorithm:
- `shortestPath`: Dijkstra-style traversal for shortest distance.
- `planRoute`: standard or accessible mode by excluding stairs-only edges.

Output:
- ordered path node list
- total walking distance meters
- ETA minutes (70m/min pacing)
