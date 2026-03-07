export interface Station {
  id: string;
  name: string;
  lat: number;
  lon: number;
  lines: string[];
}

export interface Edge {
  fromId: string;
  toId: string;
  line: string;
  distKm: number;
  travelTimeMin: number;
  fromLat: number;
  fromLon: number;
  toLat: number;
  toLon: number;
}

export interface GraphEdge {
  toId: string;
  weight: number;
  line: string;
}

export type Graph = Map<string, GraphEdge[]>;

export interface CandidateEdge {
  edge: Edge;
  distanceM: number;
  projLat: number;
  projLon: number;
  t: number; // projection parameter 0-1
}

export interface Scenario {
  id: string;
  name: string;
  timestamp: number;
  lat: number;
  lon: number;
  selectedEdges: Edge[];
  metrics: ScenarioMetrics;
  lsoaDeltas: Map<string, number>;
}

export interface ScenarioMetrics {
  netTimeImpact: number;
  stationsBenefited: number;
  stationsPenalised: number;
  lsoasBenefited: number;
  lsoasPenalised: number;
  maxBenefit: number;
  maxPenalty: number;
  avgImpact: number;
}

export type UIPhase = 'idle' | 'placing' | 'connecting' | 'computing' | 'viewing';

export interface SerializedScenario {
  id: string;
  name: string;
  timestamp: number;
  lat: number;
  lon: number;
  selectedEdges: Edge[];
  metrics: ScenarioMetrics;
  lsoaDeltas: [string, number][];
}
