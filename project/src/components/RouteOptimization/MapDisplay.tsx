import React, { useRef, useEffect } from 'react';
import mapboxgl, { LngLatBounds } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

interface MapDisplayProps {
  routes: any; // GeoJSON FeatureCollection
  startCoords: [number, number] | null;
  endCoords: [number, number] | null;
}

const MapDisplay: React.FC<MapDisplayProps> = ({ routes, startCoords, endCoords }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  // Initialize map
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [36.8219, -1.2921], // Default to Nairobi
      zoom: 10,
    });

    map.current.on('load', () => {
      if (!map.current) return;
      map.current.addSource('routes', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      });

      // Alternative routes style (drawn first, underneath)
      map.current.addLayer({
        id: 'route-alternative',
        type: 'line',
        source: 'routes',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#a0aec0', // Gray
          'line-width': 6,
          'line-opacity': 0.8,
          'line-dasharray': [2, 2],
        },
        filter: ['!=', ['get', 'isBest'], true],
      });

      // Main AI-recommended route style (drawn on top)
      map.current.addLayer({
        id: 'route-main',
        type: 'line',
        source: 'routes',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#2f855a', // Dark Green
          'line-width': 7,
          'line-opacity': 0.9,
        },
        filter: ['==', ['get', 'isBest'], true],
      });
    });
  }, []);

  // Update routes on map
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded() || !routes || !routes.features) return;

    const mapInstance = map.current;
    const source = mapInstance.getSource('routes') as mapboxgl.GeoJSONSource;

    if (source) {
      source.setData(routes);

      if (routes.features.length > 0) {
        const bounds = new LngLatBounds();
        routes.features.forEach((feature: any) => {
          feature.geometry.coordinates.forEach((coord: any) => {
            bounds.extend(coord);
          });
        });

        if (!bounds.isEmpty()) {
          mapInstance.fitBounds(bounds, {
            padding: { top: 60, bottom: 60, left: 60, right: 60 },
            duration: 1500,
          });
        }
      }
    }
  }, [routes]);

  // Add/Update markers
  useEffect(() => {
    if (!map.current) return;

    // A simple way to manage markers without complex state
    document.querySelectorAll('.mapboxgl-marker').forEach(marker => marker.remove());

    if (startCoords) {
      const startEl = document.createElement('div');
      startEl.className = 'w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-md';
      new mapboxgl.Marker(startEl)
        .setLngLat(startCoords as [number, number])
        .addTo(map.current);
    }

    if (endCoords) {
      const endEl = document.createElement('div');
      endEl.className = 'w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-md';
      new mapboxgl.Marker(endEl)
        .setLngLat(endCoords as [number, number])
        .addTo(map.current);
    }
  }, [startCoords, endCoords]);

  return <div ref={mapContainer} className="w-full h-full" />;
};

export default MapDisplay;

