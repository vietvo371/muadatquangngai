'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface MapPickerProps {
  value?: { lat: number; lng: number };
  onChange?: (value: { lat: number; lng: number }) => void;
  center?: [number, number];
  height?: string;
  className?: string;
}

export function MapPicker({
  value,
  onChange,
  center = [15.1212, 108.7922], // Quang Ngai
  height = '400px',
  className = '',
}: MapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(
    value || null
  );

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const initMap = useCallback(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const initialCenter = value ? [value.lat, value.lng] : center;
    const map = L.map(mapRef.current).setView(initialCenter, 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    // Add marker if value exists
    if (value) {
      const marker = L.marker([value.lat, value.lng], {
        draggable: true,
      }).addTo(map);

      marker.on('dragend', (e) => {
        const newPos = e.target.getLatLng();
        handleLocationChange(newPos.lat, newPos.lng);
      });

      markerRef.current = marker;
    }

    // Click to add/move marker
    map.on('click', (e) => {
      handleLocationChange(e.latlng.lat, e.latlng.lng);
    });

    mapInstanceRef.current = map;
  }, [center, value]);

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

  const handleLocationChange = (lat: number, lng: number) => {
    const newLocation = { lat, lng };
    setSelectedLocation(newLocation);
    onChange?.(newLocation);

    // Update marker position
    if (mapInstanceRef.current) {
      if (!markerRef.current) {
        markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(mapInstanceRef.current);
        markerRef.current.on('dragend', (e) => {
          const newPos = e.target.getLatLng();
          handleLocationChange(newPos.lat, newPos.lng);
        });
      } else {
        markerRef.current.setLatLng([lat, lng]);
      }
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery + ', Quang Ngai, Vietnam'
        )}`
      );
      const results = await response.json();

      if (results.length > 0) {
        const { lat, lon } = results[0];
        handleLocationChange(parseFloat(lat), parseFloat(lon));
        mapInstanceRef.current?.setView([parseFloat(lat), parseFloat(lon)], 16);
      }
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        handleLocationChange(latitude, longitude);
        mapInstanceRef.current?.setView([latitude, longitude], 16);
      },
      (error) => {
        console.error('Geolocation error:', error);
      }
    );
  };

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
    <div className={`space-y-4 ${className}`}>
      {/* Search */}
      <div className="flex gap-2">
        <Input
          placeholder="Tìm kiếm địa điểm..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="flex-1"
        />
        <Button variant="outline" onClick={handleSearch}>
          Tìm
        </Button>
        <Button variant="outline" onClick={handleGetCurrentLocation} type="button">
          Vị trí của tôi
        </Button>
      </div>

      {/* Map */}
      <div className="relative rounded-lg overflow-hidden border">
        <div ref={mapRef} style={{ height }} />
      </div>

      {/* Selected Location */}
      {selectedLocation && (
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Vị trí đã chọn:</p>
          <p className="font-mono text-sm">
            {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
          </p>
        </div>
      )}

      {/* Instructions */}
      <p className="text-xs text-gray-500">
        Nhấp vào bản đồ hoặc kéo marker để chọn vị trí chính xác của bất động sản
      </p>
    </div>
  );
}
