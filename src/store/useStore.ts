import { create } from 'zustand';
import type {
  Station,
  Edge,
  Graph,
  CandidateEdge,
  Scenario,
  ScenarioMetrics,
  UIPhase,
  SerializedScenario,
} from '../types';
import type { LSOAFeatureCollection } from '../data/loadLSOA';
import { buildGraph, cloneGraph, insertStation } from '../engine/graph';
import { computeBaseline, computeDelta, applyLSOADeltas, computeMetrics } from '../engine/accessibility';

const STORAGE_KEY = 'tube-sim-scenarios';

interface AppState {
  // Data
  stations: Station[];
  edges: Edge[];
  lsoaGeoJSON: LSOAFeatureCollection | null;
  stationMap: Map<string, Station>;
  baselineGraph: Graph;
  baselineMeans: Map<string, number>;
  dataLoaded: boolean;

  // UI state
  phase: UIPhase;
  toast: string | null;

  // Placement
  newStationLat: number;
  newStationLon: number;
  candidateEdges: CandidateEdge[];
  selectedEdgeKeys: Set<string>;

  // Results
  currentMetrics: ScenarioMetrics | null;
  currentLsoaDeltas: Map<string, number>;
  currentStationDeltas: Map<string, number>;

  // Scenarios
  scenarios: Scenario[];
  activeScenarioId: string | null;
  compareIds: Set<string>;
  showComparison: boolean;

  // Sidebar
  sidebarOpen: boolean;

  // Actions
  initData: (stations: Station[], edges: Edge[], lsoa: LSOAFeatureCollection) => void;
  startPlacing: () => void;
  placeStation: (lat: number, lon: number, candidates: CandidateEdge[]) => void;
  toggleEdge: (key: string) => void;
  cancelPlacement: () => void;
  commitStation: () => void;
  reset: () => void;
  showToast: (msg: string) => void;
  clearToast: () => void;

  // Scenario actions
  saveScenario: (name?: string) => void;
  loadScenario: (id: string) => void;
  deleteScenario: (id: string) => void;
  renameScenario: (id: string, name: string) => void;
  toggleCompare: (id: string) => void;
  setShowComparison: (show: boolean) => void;
  clearAllScenarios: () => void;
  toggleSidebar: () => void;
}

function edgeKey(e: Edge | { fromId: string; toId: string; line: string }): string {
  return `${e.fromId}-${e.toId}-${e.line}`;
}

function persistScenarios(scenarios: Scenario[]): void {
  const serialized: SerializedScenario[] = scenarios.map((s) => ({
    ...s,
    lsoaDeltas: Array.from(s.lsoaDeltas.entries()),
  }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
}

function loadPersistedScenarios(): Scenario[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SerializedScenario[];
    return parsed.map((s) => ({
      ...s,
      lsoaDeltas: new Map(s.lsoaDeltas),
    }));
  } catch {
    return [];
  }
}

export const useStore = create<AppState>((set, get) => ({
  stations: [],
  edges: [],
  lsoaGeoJSON: null,
  stationMap: new Map(),
  baselineGraph: new Map(),
  baselineMeans: new Map(),
  dataLoaded: false,

  phase: 'idle',
  toast: null,

  newStationLat: 0,
  newStationLon: 0,
  candidateEdges: [],
  selectedEdgeKeys: new Set(),

  currentMetrics: null,
  currentLsoaDeltas: new Map(),
  currentStationDeltas: new Map(),

  scenarios: loadPersistedScenarios(),
  activeScenarioId: null,
  compareIds: new Set(),
  showComparison: false,

  sidebarOpen: true,

  initData(stations, edges, lsoa) {
    const stationMap = new Map(stations.map((s) => [s.id, s]));
    const graph = buildGraph(stations, edges);
    const means = computeBaseline(graph);
    set({
      stations,
      edges,
      lsoaGeoJSON: lsoa,
      stationMap,
      baselineGraph: graph,
      baselineMeans: means,
      dataLoaded: true,
    });
  },

  startPlacing() {
    set({ phase: 'placing' });
  },

  placeStation(lat, lon, candidates) {
    const selected = new Set<string>();
    // Pre-select all candidates
    for (const c of candidates) {
      selected.add(edgeKey(c.edge));
    }
    set({
      newStationLat: lat,
      newStationLon: lon,
      candidateEdges: candidates,
      selectedEdgeKeys: selected,
      phase: 'connecting',
    });
  },

  toggleEdge(key) {
    const { selectedEdgeKeys } = get();
    const next = new Set(selectedEdgeKeys);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    set({ selectedEdgeKeys: next });
  },

  cancelPlacement() {
    set({
      phase: 'idle',
      candidateEdges: [],
      selectedEdgeKeys: new Set(),
      newStationLat: 0,
      newStationLon: 0,
    });
  },

  commitStation() {
    const {
      baselineGraph,
      baselineMeans,
      candidateEdges,
      selectedEdgeKeys,
      newStationLat,
      newStationLon,
      lsoaGeoJSON,
    } = get();

    if (selectedEdgeKeys.size === 0 || !lsoaGeoJSON) return;

    set({ phase: 'computing' });

    // Use requestAnimationFrame to let UI update before heavy computation
    requestAnimationFrame(() => {
      const modified = cloneGraph(baselineGraph);
      const newId = `NEW_STATION_${Date.now()}`;

      const selectedEdges = candidateEdges
        .filter((c) => selectedEdgeKeys.has(edgeKey(c.edge)))
        .map((c) => c.edge);

      const projections = new Map<string, { t: number }>();
      for (const c of candidateEdges) {
        if (selectedEdgeKeys.has(edgeKey(c.edge))) {
          projections.set(edgeKey(c.edge), { t: c.t });
        }
      }

      insertStation(modified, newId, selectedEdges, newStationLat, newStationLon, projections);

      const modifiedMeans = computeBaseline(modified);
      const stationDeltas = computeDelta(baselineMeans, modifiedMeans);
      const lsoaDeltas = applyLSOADeltas(lsoaGeoJSON, stationDeltas);
      const metrics = computeMetrics(stationDeltas, lsoaDeltas);

      set({
        phase: 'viewing',
        currentMetrics: metrics,
        currentLsoaDeltas: lsoaDeltas,
        currentStationDeltas: stationDeltas,
      });
    });
  },

  reset() {
    const { lsoaGeoJSON } = get();
    // Clear LSOA deltas
    if (lsoaGeoJSON) {
      for (const f of lsoaGeoJSON.features) {
        f.properties.delta = 0;
      }
    }
    set({
      phase: 'idle',
      candidateEdges: [],
      selectedEdgeKeys: new Set(),
      newStationLat: 0,
      newStationLon: 0,
      currentMetrics: null,
      currentLsoaDeltas: new Map(),
      currentStationDeltas: new Map(),
      activeScenarioId: null,
    });
  },

  showToast(msg) {
    set({ toast: msg });
    setTimeout(() => {
      set({ toast: null });
    }, 2500);
  },

  clearToast() {
    set({ toast: null });
  },

  saveScenario(name) {
    const {
      newStationLat,
      newStationLon,
      candidateEdges,
      selectedEdgeKeys,
      currentMetrics,
      currentLsoaDeltas,
      scenarios,
    } = get();

    if (!currentMetrics) return;

    const selectedEdges = candidateEdges
      .filter((c) => selectedEdgeKeys.has(edgeKey(c.edge)))
      .map((c) => c.edge);

    const scenario: Scenario = {
      id: `scenario_${Date.now()}`,
      name: name ?? `Station @ ${newStationLat.toFixed(4)}, ${newStationLon.toFixed(4)}`,
      timestamp: Date.now(),
      lat: newStationLat,
      lon: newStationLon,
      selectedEdges,
      metrics: currentMetrics,
      lsoaDeltas: new Map(currentLsoaDeltas),
    };

    const updated = [scenario, ...scenarios];
    persistScenarios(updated);
    set({ scenarios: updated, activeScenarioId: scenario.id });
  },

  loadScenario(id) {
    const { scenarios, lsoaGeoJSON, baselineGraph, baselineMeans } = get();
    const scenario = scenarios.find((s) => s.id === id);
    if (!scenario || !lsoaGeoJSON) return;

    // Recompute from saved edges
    const modified = cloneGraph(baselineGraph);
    const newId = `REPLAY_${scenario.id}`;
    const projections = new Map<string, { t: number }>();

    // Use midpoint projection for replayed scenarios
    for (const e of scenario.selectedEdges) {
      projections.set(edgeKey(e), { t: 0.5 });
    }

    insertStation(modified, newId, scenario.selectedEdges, scenario.lat, scenario.lon, projections);
    const modifiedMeans = computeBaseline(modified);
    const stationDeltas = computeDelta(baselineMeans, modifiedMeans);
    const lsoaDeltas = applyLSOADeltas(lsoaGeoJSON, stationDeltas);

    set({
      phase: 'viewing',
      newStationLat: scenario.lat,
      newStationLon: scenario.lon,
      currentMetrics: scenario.metrics,
      currentLsoaDeltas: lsoaDeltas,
      currentStationDeltas: stationDeltas,
      activeScenarioId: id,
    });
  },

  deleteScenario(id) {
    const { scenarios, activeScenarioId } = get();
    const updated = scenarios.filter((s) => s.id !== id);
    persistScenarios(updated);
    set({
      scenarios: updated,
      activeScenarioId: activeScenarioId === id ? null : activeScenarioId,
    });
  },

  renameScenario(id, name) {
    const { scenarios } = get();
    const updated = scenarios.map((s) => (s.id === id ? { ...s, name } : s));
    persistScenarios(updated);
    set({ scenarios: updated });
  },

  toggleCompare(id) {
    const { compareIds } = get();
    const next = new Set(compareIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    set({ compareIds: next });
  },

  setShowComparison(show) {
    set({ showComparison: show });
  },

  clearAllScenarios() {
    localStorage.removeItem(STORAGE_KEY);
    set({ scenarios: [], activeScenarioId: null, compareIds: new Set() });
  },

  toggleSidebar() {
    set((s) => ({ sidebarOpen: !s.sidebarOpen }));
  },
}));
