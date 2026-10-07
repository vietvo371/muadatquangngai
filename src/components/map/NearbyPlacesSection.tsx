'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Clock, Cross, GraduationCap, MapPin, ShoppingCart, Trees } from 'lucide-react';

/**
 * Tiện ích xung quanh một vị trí: 4 nhóm (trường học / siêu thị / công viên / bệnh viện)
 * trong bán kính 5 km, kèm bản đồ ghim sẵn từng điểm (Notion 06/10 "Chi tiết BĐS – Bản đồ
 * & Tiện ích xung quanh").
 *
 * Dữ liệu do phía máy chủ tra sẵn bằng Goong Place API (xem src/lib/nearby-places.ts) — ở
 * đây chỉ hiển thị, không gọi API bản đồ trả phí nào thêm.
 */

export type NearbyCategory = 'school' | 'supermarket' | 'park' | 'hospital';

export interface NearbyPlaceItem {
  name: string;
  address: string;
  dist: string;
  time: string;
  lat?: number;
  lng?: number;
}

export type NearbyPlacesData = Record<NearbyCategory, NearbyPlaceItem[]>;

const TABS: { key: NearbyCategory; label: string; Icon: React.ElementType }[] = [
  { key: 'school', label: 'Trường học', Icon: GraduationCap },
  { key: 'supermarket', label: 'Siêu thị', Icon: ShoppingCart },
  { key: 'park', label: 'Công viên', Icon: Trees },
  { key: 'hospital', label: 'Bệnh viện', Icon: Cross },
];

const GOONG_API_KEY = process.env.NEXT_PUBLIC_GOONG_API_KEY ?? '';
const MAP_STYLE = `https://tiles.goong.io/assets/goong_map_web.json?api_key=${GOONG_API_KEY}`;

interface NearbyPlacesSectionProps {
  /** Vị trí trung tâm (tin đăng / dự án). */
  latitude: number;
  longitude: number;
  /** Nhãn hiện trên ghim trung tâm. */
  centerLabel: string;
  places: NearbyPlacesData | null;
  /** Đang tra lần đầu — hiện khung chờ thay vì "không có tiện ích". */
  isLoading?: boolean;
}

/** Ghim tròn màu thương hiệu; ghim trung tâm to hơn và có viền để phân biệt. */
function createMarkerElement(isCenter: boolean, label?: string): HTMLElement {
  const el = document.createElement('div');
  if (isCenter) {
    el.className =
      'flex h-7 w-7 items-center justify-center rounded-full border-[3px] border-white bg-cta shadow-[0_2px_8px_rgba(0,0,0,0.35)]';
    el.setAttribute('aria-label', label ?? 'Vị trí bất động sản');
  } else {
    el.className =
      'flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-primary shadow-[0_2px_6px_rgba(0,0,0,0.3)]';
    el.setAttribute('aria-label', label ?? 'Tiện ích lân cận');
  }
  return el;
}

export function NearbyPlacesSection({
  latitude,
  longitude,
  centerLabel,
  places,
  isLoading = false,
}: NearbyPlacesSectionProps) {
  const [cat, setCat] = useState<NearbyCategory>('school');
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const placeMarkersRef = useRef<maplibregl.Marker[]>([]);

  // Giữ nguyên tham chiếu giữa các lần render: effect vẽ ghim phụ thuộc vào `items`, mảng
  // mới mỗi render sẽ xoá rồi vẽ lại toàn bộ ghim liên tục.
  const items = useMemo(() => places?.[cat] ?? [], [places, cat]);
  const activeLabel = TABS.find((t) => t.key === cat)?.label.toLowerCase() ?? '';

  // Khởi tạo bản đồ một lần; ghim trung tâm không đổi nên gắn luôn ở đây.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: [longitude, latitude],
      zoom: 14,
      attributionControl: false,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    // Bản đồ nằm giữa bài viết: cuộn trang không được biến thành zoom bản đồ.
    map.scrollZoom.disable();
    new maplibregl.Marker({ element: createMarkerElement(true, centerLabel) })
      .setLngLat([longitude, latitude])
      .addTo(map);

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [latitude, longitude, centerLabel]);

  // Đổi tab thì vẽ lại ghim của nhóm đang chọn.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    placeMarkersRef.current.forEach((m) => m.remove());
    placeMarkersRef.current = [];

    // Dữ liệu tra trước 07/10 chưa lưu toạ độ — khi đó vẫn hiện danh sách, chỉ không có ghim.
    const withCoords = items.filter(
      (p): p is NearbyPlaceItem & { lat: number; lng: number } =>
        typeof p.lat === 'number' && typeof p.lng === 'number'
    );

    placeMarkersRef.current = withCoords.map((p) =>
      new maplibregl.Marker({ element: createMarkerElement(false, p.name) })
        .setLngLat([p.lng, p.lat])
        .setPopup(
          new maplibregl.Popup({ offset: 14, closeButton: false }).setHTML(
            `<div class="text-[13px] font-semibold text-gray-900">${p.name}</div>
             <div class="text-[11px] text-gray-500">${p.dist} · ${p.time}</div>`
          )
        )
        .addTo(map)
    );

    const bounds = new maplibregl.LngLatBounds([longitude, latitude], [longitude, latitude]);
    withCoords.forEach((p) => bounds.extend([p.lng, p.lat]));
    if (withCoords.length > 0) {
      map.fitBounds(bounds, { padding: 56, maxZoom: 15, duration: 400 });
    } else {
      map.easeTo({ center: [longitude, latitude], zoom: 14, duration: 400 });
    }
  }, [items, latitude, longitude]);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200">
      <div ref={containerRef} className="h-[280px] w-full bg-gray-100" />

      <div className="flex overflow-x-auto border-y border-gray-100">
        {TABS.map(({ key, label, Icon }) => {
          const count = places?.[key]?.length ?? 0;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setCat(key)}
              className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 px-4 py-2.5 text-[13.5px] transition-colors ${
                cat === key
                  ? 'border-primary font-semibold text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
              {places && count > 0 && <span className="text-[12px] text-gray-400">({count})</span>}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <p className="px-4 py-6 text-center text-[13px] text-gray-400">Đang tìm tiện ích xung quanh...</p>
      ) : (
        <>
          <p className="border-b border-gray-100 bg-gray-50 px-4 py-2 text-[12px] text-gray-500">
            {items.length > 0
              ? `Có ${items.length} ${activeLabel} trong vòng 5 km`
              : `Chưa tìm thấy ${activeLabel} nào trong vòng 5 km.`}
          </p>

          <div className="divide-y divide-gray-50">
            {items.map((p) => (
              <div
                key={`${p.name}-${p.dist}`}
                className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-gray-50"
              >
                <div className="min-w-0">
                  <p className="truncate text-[13.5px] font-semibold text-gray-800">{p.name}</p>
                  {p.address && (
                    <p className="mt-0.5 flex items-center gap-1 truncate text-[12px] text-gray-400">
                      <MapPin className="h-3 w-3 shrink-0" />
                      {p.address}
                    </p>
                  )}
                </div>
                <div className="ml-4 shrink-0 text-right">
                  <p className="text-[13.5px] font-semibold text-gray-700">{p.dist}</p>
                  <p className="flex items-center justify-end gap-0.5 text-[12px] text-gray-400">
                    <Clock className="h-3 w-3" /> {p.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
