import type { AnyLayer } from 'mapbox-gl';

export function getLayers(): AnyLayer[] {
  return [
    // 1. LSOA fill — transparent initially
    {
      id: 'lsoa-fill',
      type: 'fill',
      source: 'lsoa',
      paint: {
        'fill-color': '#2C3E50',
        'fill-opacity': 0,
      },
    },
    // 2. LSOA outline
    {
      id: 'lsoa-outline',
      type: 'line',
      source: 'lsoa',
      paint: {
        'line-color': '#ffffff10',
        'line-width': 0.5,
      },
    },
    // 3a. Tube lines
    {
      id: 'tube-lines',
      type: 'line',
      source: 'tube-lines',
      paint: {
        'line-color': ['get', 'color'],
        'line-width': 2.5,
        'line-opacity': 0.85,
      },
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
    },
    // 3b. Interchange lines
    {
      id: 'interchange-lines',
      type: 'line',
      source: 'interchange-lines',
      paint: {
        'line-color': '#ffffff',
        'line-width': 1,
        'line-opacity': 0.3,
        'line-dasharray': [2, 2],
      },
    },
    // 4. Candidate edges glow
    {
      id: 'candidate-edges',
      type: 'line',
      source: 'candidate-edges',
      paint: {
        'line-color': ['get', 'color'],
        'line-width': 6,
        'line-opacity': 0.7,
      },
      layout: {
        'line-cap': 'round',
        visibility: 'none',
      },
    },
    // 5. Station dots
    {
      id: 'station-dots',
      type: 'circle',
      source: 'stations',
      paint: {
        'circle-radius': 4,
        'circle-color': ['get', 'color'],
        'circle-stroke-width': 1.5,
        'circle-stroke-color': '#ffffff',
        'circle-opacity': 0.9,
      },
    },
    // 6. New station marker
    {
      id: 'new-station',
      type: 'circle',
      source: 'new-station',
      paint: {
        'circle-radius': 10,
        'circle-color': '#00d4ff',
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff',
        'circle-opacity': 0.9,
      },
    },
    // 7. New edges (dashed)
    {
      id: 'new-edges',
      type: 'line',
      source: 'new-edges',
      paint: {
        'line-color': ['get', 'color'],
        'line-width': 3,
        'line-dasharray': [4, 3],
        'line-opacity': 0.9,
      },
      layout: {
        'line-cap': 'round',
      },
    },
  ] as mapboxgl.AnyLayer[];
}
