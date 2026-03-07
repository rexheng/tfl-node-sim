import type { Station } from '../types';

export interface LSOAFeatureCollection extends GeoJSON.FeatureCollection<GeoJSON.Polygon | GeoJSON.MultiPolygon> {
  features: LSOAFeature[];
}

export interface LSOAFeature extends GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon> {
  properties: {
    LSOA21CD: string;
    LSOA21NM: string;
    LAT: number;
    LONG: number;
    nearestStationId?: string;
    delta?: number;
    [key: string]: unknown;
  };
}

export async function loadLSOA(): Promise<LSOAFeatureCollection> {
  const resp = await fetch('/data/london_lsoa_2021.geojson');
  const geojson = (await resp.json()) as LSOAFeatureCollection;
  return geojson;
}

export function assignNearestStations(
  geojson: LSOAFeatureCollection,
  stations: Station[],
): void {
  for (const feature of geojson.features) {
    const fLat = feature.properties.LAT;
    const fLon = feature.properties.LONG;
    let minDist = Infinity;
    let nearestId = '';

    for (const s of stations) {
      const dLat = fLat - s.lat;
      const dLon = fLon - s.lon;
      const dist = dLat * dLat + dLon * dLon;
      if (dist < minDist) {
        minDist = dist;
        nearestId = s.id;
      }
    }

    feature.properties.nearestStationId = nearestId;
  }
}
