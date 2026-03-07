import Papa from 'papaparse';
import type { Station } from '../types';

interface RawStation {
  station_id: string;
  station_name: string;
  lat: string;
  lon: string;
  lines_served: string;
}

function parseLines(raw: string): string[] {
  const matches: string[] = [];
  const re = /'([^']+)'/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    matches.push(m[1]!);
  }
  return matches;
}

export async function loadStations(): Promise<Station[]> {
  const resp = await fetch('/data/tube_stations_fixed.csv');
  const text = await resp.text();
  const { data } = Papa.parse<RawStation>(text, { header: true, skipEmptyLines: true });

  return data.map((row) => ({
    id: row.station_id,
    name: row.station_name,
    lat: parseFloat(row.lat),
    lon: parseFloat(row.lon),
    lines: parseLines(row.lines_served),
  }));
}
