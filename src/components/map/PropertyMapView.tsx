'use client';

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { formatPrice } from '@/lib/formatters';

/** Tin tối thiểu để vẽ marker — chỉ những tin có toạ độ mới lên bản đồ. */
export interface MapProperty {
  id: string | number;
  title: string;
  slug: string;
  price: number;
  priceUnit?: string;
  area: number;
  type: string;
  thumbnail?: string;
  latitude: number | null;
  longitude: number | null;
}

interface PropertyMapViewProps {
  properties: MapProperty[];
  /** Tin đang được hover/chọn ở danh sách — marker tương ứng nổi bật. */
  highlightedId?: string | number | null;
  /** Bấm marker → cha cuộn danh sách tới thẻ tương ứng. */
  onMarkerClick?: (id: string | number) => void;
  className?: string;
}

const QUANG_NGAI: [number, number] = [108.7922, 15.1212]; // MapLibre dùng [lng, lat]
const GOONG_API_KEY = process.env.NEXT_PUBLIC_GOONG_API_KEY ?? '';
const GOONG_STYLE_URL = `https://tiles.goong.io/assets/goong_map_web.json?api_key=${GOONG_API_KEY}`;

/** Marker dạng "viên thuốc" hiện giá — trạng thái nổi bật đổi màu sang CTA đỏ. */
function createPriceMarker(label: string, active: boolean) {
  const el = document.createElement('button');
  el.type = 'button';
  el.className = 'bds-price-marker';
  el.textContent = label;
  el.style.cssText = `
    font: 600 12px/1 var(--font-body, system-ui);
    white-space: nowrap;
    padding: 6px 10px;
    border-radius: 9999px;
    border: 1.5px solid ${active ? '#e03131' : '#ffffff'};
    background: ${active ? '#e03131' : '#ffffff'};
    color: ${active ? '#ffffff' : '#1075b1'};
    box-shadow: 0 2px 8px rgba(0,0,0,0.18);
    cursor: pointer;
    transform: translateY(${active ? '-2px' : '0'}) scale(${active ? '1.08' : '1'});
    transition: transform .15s ease, background .15s ease, color .15s ease;
    z-index: ${active ? '10' : '1'};
  `;
  return el;
}

/**
 * Bản đồ danh sách BĐS (feedback "Tìm trên bản đồ") — vẽ nhiều marker giá bằng Goong/MapLibre
 * (KHÔNG dùng Leaflet/OSM cũ — dự án đã chốt Goong). Đồng bộ 2 chiều với danh sách qua
 * `highlightedId` (danh sách → bản đồ) và `onMarkerClick` (bản đồ → danh sách).
 */
export function PropertyMapView({ properties, highlightedId, onMarkerClick, className = '' }: PropertyMapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<string, { marker: maplibregl.Marker; el: HTMLElement; label: string }>>(new Map());
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const loadedRef = useRef(false);

  // onMarkerClick đi qua ref để effect khởi tạo/vẽ marker không phụ thuộc identity của nó.
  const onClickRef = useRef(onMarkerClick);
  onClickRef.current = onMarkerClick;

  // Khởi tạo bản đồ đúng một lần.
  useEffect(() => {
    if (!containerRef.current || mapRef.current || !GOONG_API_KEY) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: GOONG_STYLE_URL,
      center: QUANG_NGAI,
      zoom: 11,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    map.on('load', () => { loadedRef.current = true; });
    mapRef.current = map;
    const markers = markersRef.current;
    return () => {
      map.remove();
      mapRef.current = null;
      markers.clear();
      loadedRef.current = false;
    };
  }, []);

  // Vẽ lại marker mỗi khi danh sách tin đổi.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Xoá marker cũ.
    markersRef.current.forEach(({ marker }) => marker.remove());
    markersRef.current.clear();

    const withCoords = properties.filter((p) => p.latitude != null && p.longitude != null);
    if (withCoords.length === 0) return;

    const bounds = new maplibregl.LngLatBounds();
    withCoords.forEach((p) => {
      const label = p.type === 'rent' && p.priceUnit !== 'per_month'
        ? formatPrice(p.price, p.priceUnit)
        : formatPrice(p.price, p.priceUnit);
      const el = createPriceMarker(label, String(p.id) === String(highlightedId));
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        onClickRef.current?.(p.id);
        openPopup(map, p);
      });
      const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([p.longitude as number, p.latitude as number])
        .addTo(map);
      markersRef.current.set(String(p.id), { marker, el, label });
      bounds.extend([p.longitude as number, p.latitude as number]);
    });

    // Đưa toàn bộ marker vào khung nhìn (một marker thì chỉ dời tâm, không zoom quá sâu).
    if (withCoords.length === 1) {
      map.setCenter([withCoords[0].longitude as number, withCoords[0].latitude as number]);
      map.setZoom(14);
    } else {
      map.fitBounds(bounds, { padding: 60, maxZoom: 15, duration: 400 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- highlightedId xử lý ở effect riêng
  }, [properties]);

  // Đổi trạng thái nổi bật của marker khi hover/chọn ở danh sách — không vẽ lại toàn bộ.
  useEffect(() => {
    markersRef.current.forEach(({ el, label }, id) => {
      const active = id === String(highlightedId);
      const fresh = createPriceMarker(label, active);
      el.style.cssText = fresh.style.cssText;
    });
  }, [highlightedId]);

  function openPopup(map: maplibregl.Map, p: MapProperty) {
    popupRef.current?.remove();
    const href = `/${p.type === 'sell' ? 'mua-ban' : 'cho-thue'}/${p.slug}`;
    const img = p.thumbnail || '/images/image_data/Haus-Coastal.jpg';
    const html = `
      <a href="${href}" style="display:block;width:200px;text-decoration:none;color:inherit;font-family:var(--font-body,system-ui)">
        <img src="${img}" alt="" style="width:100%;height:110px;object-fit:cover;border-radius:8px 8px 0 0" referrerpolicy="no-referrer" />
        <div style="padding:8px 10px">
          <div style="font-weight:700;color:#e03131;font-size:14px">${formatPrice(p.price, p.priceUnit)}</div>
          <div style="font-size:12px;color:#374151;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${p.title}</div>
          <div style="font-size:11px;color:#6b7280;margin-top:2px">${p.area} m²</div>
        </div>
      </a>`;
    popupRef.current = new maplibregl.Popup({ offset: 24, closeButton: true, maxWidth: '220px' })
      .setLngLat([p.longitude as number, p.latitude as number])
      .setHTML(html)
      .addTo(map);
  }

  if (!GOONG_API_KEY) {
    return (
      <div className={`flex items-center justify-center bg-gray-50 text-sm text-gray-500 ${className}`}>
        Thiếu cấu hình bản đồ.
      </div>
    );
  }

  return <div ref={containerRef} className={className} />;
}
