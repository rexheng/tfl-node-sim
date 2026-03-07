export const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string;
export const MAPBOX_STYLE = 'mapbox://styles/mapbox/dark-v11';

export const MAP_CENTER: [number, number] = [-0.09, 51.505];
export const MAP_ZOOM = 11;

export const LINE_COLOURS: Record<string, string> = {
  bakerloo: '#B36305',
  central: '#E32017',
  circle: '#FFD300',
  district: '#00782A',
  'hammersmith-city': '#F3A9BB',
  jubilee: '#A0A5A9',
  metropolitan: '#9B0056',
  northern: '#000000',
  piccadilly: '#003688',
  victoria: '#0098D4',
  'waterloo-city': '#95CDBA',
  dlr: '#00A4A7',
  elizabeth: '#6950A1',
  overground: '#EE7C0E',
};

export const NEARBY_EDGE_RADIUS_M = 100;
export const INTERCHANGE_TRAVEL_TIME = 2.0;
export const TUBE_SPEED_KM_PER_MIN = 0.55;
export const DWELL_TIME_MIN = 0.5;

export const CHOROPLETH_BENEFIT = '#27AE60';
export const CHOROPLETH_NEUTRAL = '#2C3E50';
export const CHOROPLETH_PENALTY = '#C0392B';
