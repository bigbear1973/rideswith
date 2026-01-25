'use client';

import { useEffect, useRef } from 'react';

interface RideMapProps {
  center?: [number, number];
  zoom?: number;
  markers?: Array<{
    id: string;
    latitude: number;
    longitude: number;
    title: string;
  }>;
  className?: string;
}

export function RideMap({
  center = [-122.4194, 37.7749], // San Francisco default
  zoom = 11,
  markers = [],
  className = '',
}: RideMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Map initialization will be implemented when Mapbox token is configured
    // This is a placeholder that shows where markers would appear
  }, [center, zoom, markers]);

  return (
    <div
      ref={mapContainer}
      className={`w-full h-full min-h-[400px] bg-gray-100 rounded-lg flex items-center justify-center ${className}`}
    >
      <div className="text-center text-gray-500">
        <p className="text-lg font-medium">Map View</p>
        <p className="text-sm">
          Configure NEXT_PUBLIC_MAPBOX_TOKEN to enable maps
        </p>
        {markers.length > 0 && (
          <p className="text-sm mt-2">{markers.length} ride(s) to display</p>
        )}
      </div>
    </div>
  );
}
