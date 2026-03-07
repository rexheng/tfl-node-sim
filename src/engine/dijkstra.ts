import type { Graph } from '../types';

// Binary min-heap for Dijkstra
class MinHeap {
  private heap: [number, string][] = [];

  push(dist: number, id: string): void {
    this.heap.push([dist, id]);
    this.bubbleUp(this.heap.length - 1);
  }

  pop(): [number, string] | undefined {
    if (this.heap.length === 0) return undefined;
    const top = this.heap[0]!;
    const last = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.sinkDown(0);
    }
    return top;
  }

  get size(): number {
    return this.heap.length;
  }

  private bubbleUp(i: number): void {
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.heap[i]![0] < this.heap[parent]![0]) {
        [this.heap[i], this.heap[parent]] = [this.heap[parent]!, this.heap[i]!];
        i = parent;
      } else break;
    }
  }

  private sinkDown(i: number): void {
    const n = this.heap.length;
    while (true) {
      let smallest = i;
      const left = 2 * i + 1;
      const right = 2 * i + 2;
      if (left < n && this.heap[left]![0] < this.heap[smallest]![0]) smallest = left;
      if (right < n && this.heap[right]![0] < this.heap[smallest]![0]) smallest = right;
      if (smallest !== i) {
        [this.heap[i], this.heap[smallest]] = [this.heap[smallest]!, this.heap[i]!];
        i = smallest;
      } else break;
    }
  }
}

export function sssp(graph: Graph, sourceId: string): Map<string, number> {
  const dist = new Map<string, number>();
  for (const id of graph.keys()) {
    dist.set(id, Infinity);
  }
  dist.set(sourceId, 0);

  const heap = new MinHeap();
  heap.push(0, sourceId);

  while (heap.size > 0) {
    const [d, u] = heap.pop()!;
    if (d > dist.get(u)!) continue;

    const neighbors = graph.get(u);
    if (!neighbors) continue;

    for (const { toId, weight } of neighbors) {
      const newDist = d + weight;
      if (newDist < dist.get(toId)!) {
        dist.set(toId, newDist);
        heap.push(newDist, toId);
      }
    }
  }

  return dist;
}

// Returns per-station mean travel time to all reachable stations
export function allPairsMeanTravelTime(graph: Graph): Map<string, number> {
  const nodeIds = Array.from(graph.keys());
  const means = new Map<string, number>();

  for (const source of nodeIds) {
    const dists = sssp(graph, source);
    let total = 0;
    let count = 0;
    for (const [id, d] of dists) {
      if (id !== source && d < Infinity) {
        total += d;
        count++;
      }
    }
    means.set(source, count > 0 ? total / count : 0);
  }

  return means;
}
