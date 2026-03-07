import type { Station, Edge, Graph, GraphEdge } from '../types';

export function buildGraph(stations: Station[], edges: Edge[]): Graph {
  const graph: Graph = new Map();

  // Initialize all stations
  for (const s of stations) {
    graph.set(s.id, []);
  }

  // Add bidirectional edges
  for (const e of edges) {
    const fwd: GraphEdge = { toId: e.toId, weight: e.travelTimeMin, line: e.line };
    const bwd: GraphEdge = { toId: e.fromId, weight: e.travelTimeMin, line: e.line };

    graph.get(e.fromId)?.push(fwd);
    graph.get(e.toId)?.push(bwd);
  }

  return graph;
}

export function cloneGraph(graph: Graph): Graph {
  const copy: Graph = new Map();
  for (const [nodeId, neighbors] of graph) {
    copy.set(nodeId, neighbors.map((n) => ({ ...n })));
  }
  return copy;
}

export function insertStation(
  graph: Graph,
  newId: string,
  selectedEdges: Edge[],
  _newLat: number,
  _newLon: number,
  projections: Map<string, { t: number }>,
): void {
  // Add new station node
  graph.set(newId, []);

  for (const edge of selectedEdges) {
    const proj = projections.get(`${edge.fromId}-${edge.toId}-${edge.line}`);
    const t = proj?.t ?? 0.5;

    // Remove original A→B and B→A edges for this line
    const fromNeighbors = graph.get(edge.fromId);
    if (fromNeighbors) {
      const idx = fromNeighbors.findIndex(
        (n) => n.toId === edge.toId && n.line === edge.line,
      );
      if (idx !== -1) fromNeighbors.splice(idx, 1);
    }

    const toNeighbors = graph.get(edge.toId);
    if (toNeighbors) {
      const idx = toNeighbors.findIndex(
        (n) => n.toId === edge.fromId && n.line === edge.line,
      );
      if (idx !== -1) toNeighbors.splice(idx, 1);
    }

    // Proportional travel times
    const timeANew = edge.travelTimeMin * t;
    const timeNewB = edge.travelTimeMin * (1 - t);

    // Add A→New, New→A
    graph.get(edge.fromId)?.push({ toId: newId, weight: timeANew, line: edge.line });
    graph.get(newId)?.push({ toId: edge.fromId, weight: timeANew, line: edge.line });

    // Add New→B, B→New
    graph.get(newId)?.push({ toId: edge.toId, weight: timeNewB, line: edge.line });
    graph.get(edge.toId)?.push({ toId: newId, weight: timeNewB, line: edge.line });
  }
}
