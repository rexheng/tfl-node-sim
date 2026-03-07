import { useEffect, useRef, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import { MAPBOX_TOKEN, MAPBOX_STYLE, MAP_CENTER, MAP_ZOOM } from '../constants';
import { useStore } from '../store/useStore';
import {
  stationGeoJSON,
  edgesGeoJSON,
  interchangeGeoJSON,
  candidateEdgesGeoJSON,
  newStationGeoJSON,
  newEdgesGeoJSON,
  lsoaSource,
} from './sources';
import { getLayers } from './layers';
import { findNearbyEdges } from '../engine/geometry';
import {
  CHOROPLETH_BENEFIT,
  CHOROPLETH_NEUTRAL,
  CHOROPLETH_PENALTY,
} from '../constants';

mapboxgl.accessToken = MAPBOX_TOKEN;

export default function MapContainer() {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);

  const phase = useStore((s) => s.phase);
  const stations = useStore((s) => s.stations);
  const edges = useStore((s) => s.edges);
  const lsoaGeoJSON = useStore((s) => s.lsoaGeoJSON);
  const candidateEdges = useStore((s) => s.candidateEdges);
  const selectedEdgeKeys = useStore((s) => s.selectedEdgeKeys);
  const newStationLat = useStore((s) => s.newStationLat);
  const newStationLon = useStore((s) => s.newStationLon);
  const currentLsoaDeltas = useStore((s) => s.currentLsoaDeltas);
  const dataLoaded = useStore((s) => s.dataLoaded);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: MAPBOX_STYLE,
      center: MAP_CENTER,
      zoom: MAP_ZOOM,
      antialias: true,
    });

    map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Add sources and layers when data is ready
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !dataLoaded || !lsoaGeoJSON) return;

    const setup = () => {
      if (map.getSource('stations')) return; // Already setup

      // Sources
      map.addSource('lsoa', { type: 'geojson', data: lsoaSource(lsoaGeoJSON) });
      map.addSource('tube-lines', { type: 'geojson', data: edgesGeoJSON(edges) });
      map.addSource('interchange-lines', { type: 'geojson', data: interchangeGeoJSON(edges) });
      map.addSource('candidate-edges', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
      map.addSource('stations', { type: 'geojson', data: stationGeoJSON(stations) });
      map.addSource('new-station', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
      map.addSource('new-edges', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      // Layers
      for (const layer of getLayers()) {
        map.addLayer(layer);
      }
    };

    if (map.isStyleLoaded()) {
      setup();
    } else {
      map.on('style.load', setup);
    }
  }, [dataLoaded, stations, edges, lsoaGeoJSON]);

  // Map click handler
  const handleClick = useCallback(
    (e: mapboxgl.MapMouseEvent) => {
      const currentPhase = useStore.getState().phase;
      if (currentPhase !== 'placing') return;

      const { lat, lng: lon } = e.lngLat;
      const currentEdges = useStore.getState().edges;
      const candidates = findNearbyEdges(lat, lon, currentEdges);

      if (candidates.length === 0) {
        useStore.getState().showToast('No tube lines within 100m. Try closer to a line.');
        return;
      }

      useStore.getState().placeStation(lat, lon, candidates);
    },
    [],
  );

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.on('click', handleClick);
    return () => { map.off('click', handleClick); };
  }, [handleClick]);

  // Station hover popup
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !dataLoaded) return;

    const onEnter = (e: mapboxgl.MapMouseEvent) => {
      const features = map.queryRenderedFeatures(e.point, { layers: ['station-dots'] });
      if (features.length > 0) {
        map.getCanvas().style.cursor = 'pointer';
        const props = features[0]!.properties!;
        if (popupRef.current) popupRef.current.remove();
        popupRef.current = new mapboxgl.Popup({ closeButton: false, offset: 10 })
          .setLngLat(e.lngLat)
          .setHTML(`<strong>${props['name']}</strong><br/><small>${props['lines']}</small>`)
          .addTo(map);
      }
    };

    const onLeave = () => {
      if (useStore.getState().phase !== 'placing') {
        map.getCanvas().style.cursor = '';
      }
      if (popupRef.current) {
        popupRef.current.remove();
        popupRef.current = null;
      }
    };

    map.on('mouseenter', 'station-dots', onEnter);
    map.on('mouseleave', 'station-dots', onLeave);

    return () => {
      map.off('mouseenter', 'station-dots', onEnter);
      map.off('mouseleave', 'station-dots', onLeave);
    };
  }, [dataLoaded]);

  // Cursor management for placing phase
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.getCanvas().style.cursor = phase === 'placing' ? 'crosshair' : '';
  }, [phase]);

  // Update candidate edges source
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getSource('candidate-edges')) return;

    const src = map.getSource('candidate-edges') as mapboxgl.GeoJSONSource;
    src.setData(candidateEdgesGeoJSON(candidateEdges));
    map.setLayoutProperty(
      'candidate-edges',
      'visibility',
      candidateEdges.length > 0 ? 'visible' : 'none',
    );
  }, [candidateEdges]);

  // Update new station marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getSource('new-station')) return;

    const src = map.getSource('new-station') as mapboxgl.GeoJSONSource;
    src.setData(newStationGeoJSON(newStationLat, newStationLon));
  }, [newStationLat, newStationLon]);

  // Update new edges
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getSource('new-edges')) return;

    const src = map.getSource('new-edges') as mapboxgl.GeoJSONSource;
    src.setData(newEdgesGeoJSON(candidateEdges, selectedEdgeKeys, newStationLat, newStationLon));
  }, [candidateEdges, selectedEdgeKeys, newStationLat, newStationLon]);

  // Update LSOA choropleth
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !lsoaGeoJSON || !map.getSource('lsoa')) return;

    if (currentLsoaDeltas.size === 0) {
      map.setPaintProperty('lsoa-fill', 'fill-opacity', 0);
      return;
    }

    // Update source data with deltas
    const src = map.getSource('lsoa') as mapboxgl.GeoJSONSource;
    src.setData(lsoaSource(lsoaGeoJSON));

    // Find max delta for scaling
    let maxAbs = 0;
    for (const [, d] of currentLsoaDeltas) {
      maxAbs = Math.max(maxAbs, Math.abs(d));
    }
    if (maxAbs === 0) maxAbs = 1;

    map.setPaintProperty('lsoa-fill', 'fill-color', [
      'interpolate',
      ['linear'],
      ['coalesce', ['get', 'delta'], 0],
      -maxAbs,
      CHOROPLETH_BENEFIT,
      0,
      CHOROPLETH_NEUTRAL,
      maxAbs,
      CHOROPLETH_PENALTY,
    ]);

    map.setPaintProperty('lsoa-fill', 'fill-opacity', [
      'interpolate',
      ['linear'],
      ['abs', ['coalesce', ['get', 'delta'], 0]],
      0,
      0.3,
      maxAbs,
      0.75,
    ]);
  }, [currentLsoaDeltas, lsoaGeoJSON]);

  return <div ref={containerRef} className="map-container" />;
}
