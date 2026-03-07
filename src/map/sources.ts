import type { Station, Edge, CandidateEdge } from '../types';
import type { LSOAFeatureCollection } from '../data/loadLSOA';
import { LINE_COLOURS } from '../constants';

export function stationGeoJSON(stations: Station[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: stations.map((s) => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [s.lon, s.lat] },
      properties: {
        id: s.id,
        name: s.name,
        color: LINE_COLOURS[s.lines[0] ?? 'northern'] ?? '#888',
        lines: s.lines.join(', '),
      },
    })),
  };
}

export function edgesGeoJSON(edges: Edge[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: edges
      .filter((e) => e.line !== 'interchange')
      .map((e) => ({
        type: 'Feature' as const,
        geometry: {
          type: 'LineString' as const,
          coordinates: [
            [e.fromLon, e.fromLat],
            [e.toLon, e.toLat],
          ],
        },
        properties: {
          line: e.line,
          color: LINE_COLOURS[e.line] ?? '#888',
          fromName: e.fromId,
          toName: e.toId,
        },
      })),
  };
}

export function interchangeGeoJSON(edges: Edge[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: edges
      .filter((e) => e.line === 'interchange')
      .map((e) => ({
        type: 'Feature' as const,
        geometry: {
          type: 'LineString' as const,
          coordinates: [
            [e.fromLon, e.fromLat],
            [e.toLon, e.toLat],
          ],
        },
        properties: { line: 'interchange' },
      })),
  };
}

export function candidateEdgesGeoJSON(candidates: CandidateEdge[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: candidates.map((c) => ({
      type: 'Feature' as const,
      geometry: {
        type: 'LineString' as const,
        coordinates: [
          [c.edge.fromLon, c.edge.fromLat],
          [c.edge.toLon, c.edge.toLat],
        ],
      },
      properties: {
        line: c.edge.line,
        color: LINE_COLOURS[c.edge.line] ?? '#888',
      },
    })),
  };
}

export function newStationGeoJSON(lat: number, lon: number): GeoJSON.FeatureCollection {
  if (lat === 0 && lon === 0) {
    return { type: 'FeatureCollection', features: [] };
  }
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [lon, lat] },
        properties: {},
      },
    ],
  };
}

export function newEdgesGeoJSON(
  candidates: CandidateEdge[],
  selectedKeys: Set<string>,
  newLat: number,
  newLon: number,
): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = [];
  for (const c of candidates) {
    const key = `${c.edge.fromId}-${c.edge.toId}-${c.edge.line}`;
    if (!selectedKeys.has(key)) continue;
    // Line from A to new station
    features.push({
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [c.edge.fromLon, c.edge.fromLat],
          [newLon, newLat],
        ],
      },
      properties: { color: LINE_COLOURS[c.edge.line] ?? '#888' },
    });
    // Line from new station to B
    features.push({
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [newLon, newLat],
          [c.edge.toLon, c.edge.toLat],
        ],
      },
      properties: { color: LINE_COLOURS[c.edge.line] ?? '#888' },
    });
  }
  return { type: 'FeatureCollection', features };
}

export function lsoaSource(geojson: LSOAFeatureCollection): GeoJSON.FeatureCollection {
  return geojson as unknown as GeoJSON.FeatureCollection;
}
