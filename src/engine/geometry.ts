import type { Edge, CandidateEdge } from '../types';
import { NEARBY_EDGE_RADIUS_M } from '../constants';

const R_EARTH = 6371000; // metres

export function haversineM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = Math.PI / 180;
  const dLat = (lat2 - lat1) * toRad;
  const dLon = (lon2 - lon1) * toRad;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) * Math.sin(dLon / 2) ** 2;
  return R_EARTH * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function pointToSegmentProjection(
  pLat: number,
  pLon: number,
  aLat: number,
  aLon: number,
  bLat: number,
  bLon: number,
): { t: number; projLat: number; projLon: number; distM: number } {
  const apLat = pLat - aLat;
  const apLon = pLon - aLon;
  const abLat = bLat - aLat;
  const abLon = bLon - aLon;

  const dot = apLat * abLat + apLon * abLon;
  const lenSq = abLat * abLat + abLon * abLon;
  const t = lenSq === 0 ? 0 : Math.max(0, Math.min(1, dot / lenSq));

  const projLat = aLat + t * abLat;
  const projLon = aLon + t * abLon;
  const distM = haversineM(pLat, pLon, projLat, projLon);

  return { t, projLat, projLon, distM };
}

export function findNearbyEdges(
  lat: number,
  lon: number,
  edges: Edge[],
  radiusM: number = NEARBY_EDGE_RADIUS_M,
): CandidateEdge[] {
  const candidates: CandidateEdge[] = [];

  for (const edge of edges) {
    // Skip interchange edges
    if (edge.line === 'interchange') continue;

    const { t, projLat, projLon, distM } = pointToSegmentProjection(
      lat,
      lon,
      edge.fromLat,
      edge.fromLon,
      edge.toLat,
      edge.toLon,
    );

    if (distM <= radiusM) {
      candidates.push({ edge, distanceM: distM, projLat, projLon, t });
    }
  }

  // Group by line, keep closest edge per line
  const byLine = new Map<string, CandidateEdge>();
  for (const c of candidates) {
    const existing = byLine.get(c.edge.line);
    if (!existing || c.distanceM < existing.distanceM) {
      byLine.set(c.edge.line, c);
    }
  }

  return Array.from(byLine.values());
}
