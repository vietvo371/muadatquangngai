'use client';

import { MapPin } from 'lucide-react';

interface MapPreviewProps {
  lat: number;
  lng: number;
  address?: string;
  height?: string;
  zoom?: number;
}

export function MapPreview({
  lat,
  lng,
  address,
  height = '300px',
  zoom = 15,
}: MapPreviewProps) {
  // In production, replace with actual Google Maps / Mapbox / Leaflet
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01},${lat - 0.01},${lng + 0.01},${lat + 0.01}&layer=mapnik&marker=${lat},${lng}`;

  return (
    <div className="space-y-2">
      <div
        className="rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center"
        style={{ height }}
      >
        <div className="text-center p-8">
          <MapPin className="h-12 w-12 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-500 mb-2">Bản đồ tương tác</p>
          <p className="text-sm text-gray-400">
            Tích hợp Google Maps / Mapbox
          </p>
          {address && (
            <p className="text-sm text-gray-500 mt-2 flex items-center justify-center gap-1">
              <MapPin className="h-3 w-3" />
              {address}
            </p>
          )}
          <a
            href={`https://www.google.com/maps?q=${lat},${lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-4 text-blue-600 hover:underline text-sm"
          >
            Mở trên Google Maps
          </a>
        </div>
      </div>
    </div>
  );
}
