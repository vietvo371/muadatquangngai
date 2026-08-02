'use client';

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface PropertyLocationMapProps {
  latitude: number;
  longitude: number;
  className?: string;
}

const GOONG_API_KEY = process.env.NEXT_PUBLIC_GOONG_API_KEY ?? '';
const GOONG_STYLE_URL = `https://tiles.goong.io/assets/goong_map_web.json?api_key=${GOONG_API_KEY}`;

/**
 * Bản đồ CHỈ XEM cho tab "Bản đồ" ở trang chi tiết (Đợt 4, III.2) — 1 điểm ghim cố định, không
 * tìm kiếm/không danh sách. Khác `PropertyMapView.tsx` (nhiều marker giá cho trang danh sách) và
 * khác `MapPicker.tsx` (UI tương tác cho form đăng tin) — cả hai không hợp cho nhu cầu "chỉ xem
 * 1 vị trí" ở đây.
 */
export function PropertyLocationMap({ latitude, longitude, className = '' }: PropertyLocationMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current || !GOONG_API_KEY) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: GOONG_STYLE_URL,
      center: [longitude, latitude],
      zoom: 15,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    new maplibregl.Marker({ color: '#e03131' }).setLngLat([longitude, latitude]).addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [latitude, longitude]);

  if (!GOONG_API_KEY) {
    return (
      <div className={`flex items-center justify-center bg-gray-50 text-sm text-gray-500 ${className}`}>
        Thiếu cấu hình bản đồ.
      </div>
    );
  }

  return <div ref={containerRef} className={className} />;
}
