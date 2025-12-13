'use client';

import { useRef, useEffect } from 'react';

interface WardStatus {
  ward_id: number;
  ward_name: string;
  status: 'green' | 'yellow' | 'red' | 'blue' | 'pink';
  signal_count: number;
}

interface WardMapProps {
  wardStatuses: WardStatus[];
}

export function WardMap({ wardStatuses }: WardMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // For MVP, show a simple grid representation of wards
    // In production, integrate Mapbox GL JS with GeoJSON ward polygons
  }, [wardStatuses]);

  const getColorClass = (status: string) => {
    const colors = {
      green: 'bg-ward-green',
      yellow: 'bg-ward-yellow',
      red: 'bg-ward-red',
      blue: 'bg-ward-blue',
      pink: 'bg-ward-pink',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-300';
  };

  return (
    <div ref={mapContainerRef} className="h-full bg-gray-100 p-8">
      {/* Simplified grid representation of DC wards for MVP */}
      <div className="grid grid-cols-4 gap-4 h-full">
        {wardStatuses.map((ward) => (
          <a
            key={ward.ward_id}
            href={`/ward/${ward.ward_id}`}
            className={`
              ${getColorClass(ward.status)}
              rounded-lg p-4 text-white
              hover:opacity-80 transition-opacity
              flex flex-col items-center justify-center
              cursor-pointer shadow-lg
            `}
          >
            <div className="text-2xl font-bold">{ward.ward_name}</div>
            <div className="text-sm mt-2">{ward.signal_count} signals</div>
            <div className="text-xs mt-1 capitalize">{ward.status}</div>
          </a>
        ))}
      </div>

      {/* Note: In production, replace with Mapbox GL JS */}
      <div className="mt-4 text-sm text-gray-600 text-center">
        Note: Simplified grid view. Production will use Mapbox GL with actual ward polygons.
      </div>
    </div>
  );
}
