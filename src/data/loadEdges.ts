import Papa from 'papaparse';
import type { Edge } from '../types';
import { TUBE_SPEED_KM_PER_MIN, DWELL_TIME_MIN, INTERCHANGE_TRAVEL_TIME } from '../constants';

interface RawEdge {
  station_from_id: string;
  station_from_name: string;
  station_from_lat: string;
  station_from_lon: string;
  station_to_id: string;
  station_to_name: string;
  station_to_lat: string;
  station_to_lon: string;
  line: string;
  edge_distance_km: string;
}

export async function loadEdges(): Promise<Edge[]> {
  const resp = await fetch('/data/tube_edges_fixed.csv');
  const text = await resp.text();
  const { data } = Papa.parse<RawEdge>(text, { header: true, skipEmptyLines: true });

  return data.map((row) => {
    const distKm = parseFloat(row.edge_distance_km);
    const line = row.line;
    const isInterchange = line === 'interchange';
    const travelTimeMin = isInterchange
      ? INTERCHANGE_TRAVEL_TIME
      : distKm / TUBE_SPEED_KM_PER_MIN + DWELL_TIME_MIN;

    return {
      fromId: row.station_from_id,
      toId: row.station_to_id,
      line,
      distKm,
      travelTimeMin,
      fromLat: parseFloat(row.station_from_lat),
      fromLon: parseFloat(row.station_from_lon),
      toLat: parseFloat(row.station_to_lat),
      toLon: parseFloat(row.station_to_lon),
    };
  });
}
