'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Property {
  id: number;
  title: string;
  slug: string;
  latitude: number;
  longitude: number;
  price: number;
  type: string;
  thumbnail?: string;
}

interface MapSearchProps {
  properties?: Property[];
  center?: [number, number];
  zoom?: number;
  height?: string;
  onPropertyClick?: (property: Property) => void;
  className?: string;
}

const defaultIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const vipIcon = new L.Icon({
  iconUrl: '/images/marker-vip.png',
  iconSize: [32, 41],
  iconAnchor: [16, 41],
  popupAnchor: [1, -34],
});

export function MapSearch({
  properties = [],
  center = [15.1212, 108.7922], // Quang Ngai
  zoom = 13,
  height = '500px',
  onPropertyClick,
  className = '',
}: MapSearchProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const initMap = useCallback(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current).setView(center, zoom);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;
  }, [center, zoom]);

  useEffect(() => {
    if (isMounted) {
      initMap();
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isMounted, initMap]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    properties.forEach((property) => {
      if (!property.latitude || !property.longitude) return;

      const icon = property.type === 'vip' ? vipIcon : defaultIcon;
      const marker = L.marker([property.latitude, property.longitude], { icon })
        .addTo(mapInstanceRef.current!);

      const popupContent = `
        <div class="min-w-[200px]">
          <h3 class="font-semibold text-sm mb-1">${property.title}</h3>
          <p class="text-primary font-bold">${formatPrice(property.price)}</p>
        </div>
      `;

      marker.bindPopup(popupContent);

      marker.on('click', () => {
        onPropertyClick?.(property);
      });

      markersRef.current.push(marker);
    });
  }, [properties, onPropertyClick]);

  if (!isMounted) {
    return (
      <div
        className={`bg-gray-100 flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <p className="text-gray-500">Đang tải bản đồ...</p>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ height }}>
      <div ref={mapRef} className="w-full h-full rounded-lg overflow-hidden" />

      {/* Map Controls */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
        <button
          onClick={() => mapInstanceRef.current?.zoomIn()}
          className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50"
        >
          <span className="text-xl font-bold">+</span>
        </button>
        <button
          onClick={() => mapInstanceRef.current?.zoomOut()}
          className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50"
        >
          <span className="text-xl font-bold">−</span>
        </button>
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-white rounded-lg shadow-md p-3">
        <p className="text-xs font-medium text-gray-600 mb-2">Chú thích</p>
        <div className="flex items-center gap-2 text-xs">
          <img src="https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png" alt="" className="w-4 h-4" />
          <span>Tin thường</span>
        </div>
      </div>
    </div>
  );
}

function formatPrice(price: number): string {
  if (price >= 1000000000) {
    return `${(price / 1000000000).toFixed(1)} tỷ`;
  }
  if (price >= 1000000) {
    return `${(price / 1000000).toFixed(0)} triệu`;
  }
  return `${price.toLocaleString('vi-VN')} đ`;
}
