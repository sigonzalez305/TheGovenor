'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Hotspot } from '@/types/widgets';
import { useWidgetStore } from '@/store/widgetStore';

interface HotspotMapProps {
  hotspots: Hotspot[];
  wardGeojson?: any; // Ward boundary GeoJSON
}

// Note: In production, set this via environment variable
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

export function HotspotMap({ hotspots, wardGeojson }: HotspotMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const { openDrawer, sentimentFilter, themeFilter, timeRange } = useWidgetStore();

  // Filter hotspots based on global filters
  const filteredHotspots = hotspots.filter((hotspot) => {
    if (sentimentFilter !== 'all') {
      // Additional filtering logic based on sentiment
      return true; // Placeholder
    }
    if (themeFilter) {
      return hotspot.topThemes.includes(themeFilter);
    }
    return true;
  });

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    if (!MAPBOX_TOKEN) {
      console.warn('Mapbox token not set. Map will not render.');
      return;
    }

    mapboxgl.accessToken = MAPBOX_TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-77.0369, 38.9072], // Washington DC coordinates
      zoom: 11,
    });

    map.current.on('load', () => {
      setMapLoaded(true);
    });

    return () => {
      map.current?.remove();
    };
  }, []);

  // Add ward boundaries
  useEffect(() => {
    if (!map.current || !mapLoaded || !wardGeojson) return;

    if (map.current.getSource('wards')) {
      map.current.removeLayer('ward-boundaries');
      map.current.removeSource('wards');
    }

    map.current.addSource('wards', {
      type: 'geojson',
      data: wardGeojson,
    });

    map.current.addLayer({
      id: 'ward-boundaries',
      type: 'line',
      source: 'wards',
      paint: {
        'line-color': '#888',
        'line-width': 2,
        'line-opacity': 0.5,
      },
    });
  }, [mapLoaded, wardGeojson]);

  // Update hotspot markers
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Remove existing markers
    const existingMarkers = document.querySelectorAll('.hotspot-marker');
    existingMarkers.forEach((marker) => marker.remove());

    // Add new markers
    filteredHotspots.forEach((hotspot) => {
      const el = document.createElement('div');
      el.className = 'hotspot-marker cursor-pointer';

      const size = Math.max(20, Math.min(50, hotspot.volume / 5));
      const color = getSeverityColor(hotspot.severity);
      const pulseClass = hotspot.isActive ? 'animate-pulse' : '';

      el.innerHTML = `
        <div class="relative">
          <div class="absolute inset-0 ${color} rounded-full opacity-30 ${pulseClass}" style="width: ${size * 1.5}px; height: ${size * 1.5}px; margin-left: -${size * 0.25}px; margin-top: -${size * 0.25}px;"></div>
          <div class="${color} rounded-full shadow-lg flex items-center justify-center text-white font-bold" style="width: ${size}px; height: ${size}px; font-size: ${Math.max(10, size / 3)}px;">
            ${hotspot.volume}
          </div>
        </div>
      `;

      el.addEventListener('click', () => {
        openDrawer('hotspot', hotspot.id);
      });

      new mapboxgl.Marker({ element: el })
        .setLngLat([hotspot.location.lng, hotspot.location.lat])
        .addTo(map.current!);
    });
  }, [mapLoaded, filteredHotspots, openDrawer]);

  const getSeverityColor = (severity: Hotspot['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-ward-red';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-ward-yellow';
      case 'low':
        return 'bg-ward-green';
      default:
        return 'bg-gray-400';
    }
  };

  if (!MAPBOX_TOKEN) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-2">Map Unavailable</div>
          <div className="text-gray-600 text-sm">
            Mapbox token not configured. Set NEXT_PUBLIC_MAPBOX_TOKEN environment variable.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Hotspot Map</h2>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-600">
            Showing {filteredHotspots.length} of {hotspots.length} hotspots
          </span>
        </div>
      </div>

      <div ref={mapContainer} className="w-full h-[600px]" />

      {/* Legend */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-ward-red rounded-full"></div>
            <span>Critical</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
            <span>High</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-ward-yellow rounded-full"></div>
            <span>Medium</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-ward-green rounded-full"></div>
            <span>Low</span>
          </div>
        </div>
      </div>
    </div>
  );
}
