'use client';

import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Map as MapIcon, Tag, Satellite } from 'lucide-react';
import { formatPrice, derivePrices } from '@/lib/formatters';

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
  location?: string;
  latitude: number | null;
  longitude: number | null;
}

interface PropertyMapViewProps {
  properties: MapProperty[];
  /** Tin đang được hover/chọn ở danh sách — marker tương ứng nổi bật. */
  highlightedId?: string | number | null;
  /** Bấm marker → cha cuộn danh sách tới thẻ tương ứng. */
  onMarkerClick?: (id: string | number) => void;
  /** Bấm thẻ xem nhanh trên bản đồ → mở trang chi tiết bằng điều hướng nội bộ. */
  onMarkerOpen?: (id: string | number) => void;
  /** Người dùng kéo/zoom xong → phát khung nhìn để cha đề nghị "tìm khu vực này". */
  onUserMove?: (bounds: MapBounds) => void;
  /** Bỏ qua fitBounds tự động theo danh sách khi đang tìm-theo-vùng. */
  autoFit?: boolean;
  /** Gom marker gần nhau thành cụm kèm số đếm (chỉ bật ở chế độ bản đồ toàn màn hình). */
  cluster?: boolean;
  /** Hiện nút chuyển Bản đồ / Vệ tinh. */
  showLayerSwitch?: boolean;
  /** false = bản đồ tĩnh hoàn toàn: không kéo, không zoom, không nút điều khiển. */
  interactive?: boolean;
  /** false = tắt zoom bằng con lăn chuột (bản đồ xem trước nằm giữa trang, không cướp thao tác
   * cuộn trang); vẫn còn nút +/- và kéo thả. */
  scrollZoom?: boolean;
  className?: string;
}

export interface MapBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

const QUANG_NGAI: [number, number] = [108.7922, 15.1212]; // MapLibre dùng [lng, lat]
const GOONG_API_KEY = process.env.NEXT_PUBLIC_GOONG_API_KEY ?? '';
const styleUrl = (name: string) => `https://tiles.goong.io/assets/${name}.json?api_key=${GOONG_API_KEY}`;
/** Ba lớp nền như thiết kế: "Giá" dùng nền bản đồ thường + lớp nhiệt theo giá mỗi m². */
const LAYERS = {
  map: { label: 'Bản đồ', style: styleUrl('goong_map_web'), Icon: MapIcon },
  price: { label: 'Giá', style: styleUrl('goong_map_web'), Icon: Tag },
  satellite: { label: 'Vệ tinh', style: styleUrl('goong_satellite'), Icon: Satellite },
} as const;
type LayerKind = keyof typeof LAYERS;
const PRICE_SOURCE_ID = 'bds-price-heat';
const PRICE_LAYER_ID = 'bds-price-heat-layer';

/** Ô lưới (pixel màn hình) để gom marker — hai tin cách nhau dưới mức này gộp thành một cụm. */
const CLUSTER_GRID_PX = 64;

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

/** Bong bóng cụm — số tin gộp lại, to dần theo số lượng. */
function createClusterMarker(count: number) {
  const size = count < 10 ? 38 : count < 50 ? 46 : 54;
  const el = document.createElement('button');
  el.type = 'button';
  el.className = 'bds-cluster-marker';
  el.textContent = String(count);
  el.setAttribute('aria-label', `Cụm ${count} tin đăng, bấm để phóng to`);
  el.style.cssText = `
    font: 700 13px/1 var(--font-body, system-ui);
    width: ${size}px;
    height: ${size}px;
    border-radius: 9999px;
    border: 2px solid #ffffff;
    background: #111827;
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 10px rgba(0,0,0,0.25);
    cursor: pointer;
  `;
  return el;
}

/**
 * Bản đồ danh sách BĐS bằng Goong/MapLibre (KHÔNG dùng Leaflet/OSM cũ). Ba cách dùng:
 * - Xem trước ở hàng đầu trang danh sách: `interactive={false}`, bản đồ tĩnh.
 * - Bản đồ toàn màn hình: `cluster` + `showLayerSwitch`, kéo/zoom và tìm theo khung nhìn.
 * - Đồng bộ 2 chiều với danh sách qua `highlightedId` và `onMarkerClick`.
 */
export function PropertyMapView({
  properties,
  highlightedId,
  onMarkerClick,
  onMarkerOpen,
  onUserMove,
  autoFit = true,
  cluster = false,
  showLayerSwitch = false,
  interactive = true,
  scrollZoom = true,
  className = '',
}: PropertyMapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<string, { marker: maplibregl.Marker; el: HTMLElement; label: string }>>(new Map());
  const popupRef = useRef<maplibregl.Popup | null>(null);
  // ĐẾM số lần dời bản đồ do CODE (fitBounds, bấm cụm) để moveend không nhầm là người dùng kéo.
  // Phải là bộ đếm chứ không phải cờ bật/tắt: hai fitBounds liên tiếp (đổi chế độ xong lại
  // đổi số tin mỗi trang) đặt cờ hai lần nhưng cờ chỉ nhớ được một, lần moveend thứ hai bị coi
  // là người dùng kéo và nút "Tìm trong khu vực này" hiện lên vô cớ.
  const programmaticMovesRef = useRef(0);
  const [layer, setLayer] = useState<LayerKind>('map');

  // Callback đi qua ref để effect khởi tạo/vẽ không phụ thuộc identity của chúng.
  const onClickRef = useRef(onMarkerClick);
  onClickRef.current = onMarkerClick;
  const onOpenRef = useRef(onMarkerOpen);
  onOpenRef.current = onMarkerOpen;
  const onUserMoveRef = useRef(onUserMove);
  onUserMoveRef.current = onUserMove;
  // Dữ liệu vẽ lại nằm trong ref để handler moveend luôn thấy giá trị mới nhất.
  const drawRef = useRef<() => void>(() => {});

  // Khởi tạo bản đồ đúng một lần.
  useEffect(() => {
    if (!containerRef.current || mapRef.current || !GOONG_API_KEY) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: LAYERS.map.style,
      center: QUANG_NGAI,
      zoom: 11,
      interactive,
      scrollZoom: interactive && scrollZoom,
      dragRotate: false,
      attributionControl: false,
    });
    if (interactive) {
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    }
    map.on('moveend', () => {
      // Vẽ lại vì cụm phụ thuộc mức zoom và vị trí pixel hiện tại.
      drawRef.current();
      if (programmaticMovesRef.current > 0) { programmaticMovesRef.current -= 1; return; }
      const b = map.getBounds();
      onUserMoveRef.current?.({
        minLat: b.getSouth(), maxLat: b.getNorth(), minLng: b.getWest(), maxLng: b.getEast(),
      });
    });
    mapRef.current = map;
    const markers = markersRef.current;
    return () => {
      map.remove();
      mapRef.current = null;
      markers.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- interactive cố định theo nơi dùng
  }, []);

  // Đổi lớp nền. Marker là phần tử DOM riêng nên sống sót qua setStyle; lớp nhiệt "Giá" thì
  // KHÔNG (setStyle xoá mọi source/layer tự thêm) nên phải thêm lại sau khi style mới nạp xong.
  const lastStyleRef = useRef<string>(LAYERS.map.style);
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const nextStyle = LAYERS[layer].style;
    const syncHeat = () => updatePriceHeat(map, layer === 'price' ? properties : []);
    if (nextStyle !== lastStyleRef.current) {
      lastStyleRef.current = nextStyle;
      map.setStyle(nextStyle);
      map.once('style.load', syncHeat);
    } else if (map.isStyleLoaded()) {
      syncHeat();
    } else {
      map.once('style.load', syncHeat);
    }
  }, [layer, properties]);

  // Vẽ marker: gom cụm theo lưới pixel khi bật `cluster`, còn lại là viên thuốc giá.
  useEffect(() => {
    const draw = () => {
      const map = mapRef.current;
      if (!map) return;

      markersRef.current.forEach(({ marker }) => marker.remove());
      markersRef.current.clear();

      const withCoords = properties.filter((p) => p.latitude != null && p.longitude != null);
      if (withCoords.length === 0) return;

      const addSingle = (p: MapProperty) => {
        const label = formatPrice(p.price, p.priceUnit);
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
      };

      if (!cluster) {
        withCoords.forEach(addSingle);
      } else {
        // Gom theo ô lưới trên màn hình: tin nào chiếu vào cùng ô thì thành một cụm.
        const buckets = new Map<string, MapProperty[]>();
        withCoords.forEach((p) => {
          const pt = map.project([p.longitude as number, p.latitude as number]);
          const key = `${Math.floor(pt.x / CLUSTER_GRID_PX)}:${Math.floor(pt.y / CLUSTER_GRID_PX)}`;
          const list = buckets.get(key);
          if (list) list.push(p);
          else buckets.set(key, [p]);
        });

        buckets.forEach((items, key) => {
          if (items.length === 1) {
            addSingle(items[0]);
            return;
          }
          const lng = items.reduce((s, p) => s + (p.longitude as number), 0) / items.length;
          const lat = items.reduce((s, p) => s + (p.latitude as number), 0) / items.length;
          const el = createClusterMarker(items.length);
          el.addEventListener('click', (e) => {
            e.stopPropagation();
            programmaticMovesRef.current += 1;
            map.easeTo({ center: [lng, lat], zoom: Math.min(map.getZoom() + 2, 18), duration: 400 });
          });
          const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
            .setLngLat([lng, lat])
            .addTo(map);
          markersRef.current.set(`cluster:${key}`, { marker, el, label: '' });
        });
      }
    };

    drawRef.current = draw;
    draw();

    // Đưa toàn bộ marker vào khung nhìn — KHÔNG tự dời khi đang tìm-theo-vùng, để giữ đúng
    // khung người dùng đã kéo tới.
    const map = mapRef.current;
    const withCoords = properties.filter((p) => p.latitude != null && p.longitude != null);
    if (map && autoFit && withCoords.length > 0) {
      programmaticMovesRef.current += 1;
      if (withCoords.length === 1) {
        map.setCenter([withCoords[0].longitude as number, withCoords[0].latitude as number]);
        map.setZoom(14);
      } else {
        const bounds = new maplibregl.LngLatBounds();
        withCoords.forEach((p) => bounds.extend([p.longitude as number, p.latitude as number]));
        map.fitBounds(bounds, { padding: 60, maxZoom: 15, duration: 400 });
      }
    }
    // Đổi lớp nền KHÔNG vẽ lại/dời khung: marker sống sót qua setStyle, dời khung mỗi lần bấm
    // "Vệ tinh" sẽ làm người xem mất chỗ đang nhìn.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- highlightedId xử lý ở effect riêng
  }, [properties, cluster]);

  // Đổi trạng thái nổi bật của marker đơn khi hover/chọn ở danh sách — không vẽ lại toàn bộ.
  useEffect(() => {
    markersRef.current.forEach(({ el, label }, id) => {
      if (id.startsWith('cluster:')) return;
      const fresh = createPriceMarker(label, id === String(highlightedId));
      el.style.cssText = fresh.style.cssText;
    });
  }, [highlightedId]);

  /** Thẻ xem nhanh khi bấm marker (thiết kế 23/09): ảnh nhỏ bên trái, giá, tiêu đề, diện tích ·
   * khu vực, mũi tên bên phải; bấm cả thẻ mở trang chi tiết. */
  function openPopup(map: maplibregl.Map, p: MapProperty) {
    popupRef.current?.remove();
    const href = `/${p.type === 'sell' ? 'mua-ban' : 'cho-thue'}/${p.slug}`;
    const img = p.thumbnail || '/images/image_data/Haus-Coastal.jpg';
    const escape = (s: string) => s.replace(/[<>&"]/g, (c) => `&#${c.charCodeAt(0)};`);
    const html = `
      <a href="${href}" data-property-id="${escape(String(p.id))}" style="display:flex;align-items:center;gap:10px;width:260px;padding:8px;text-decoration:none;color:inherit;font-family:var(--font-body,system-ui)">
        <img src="${img}" alt="" style="width:64px;height:56px;flex-shrink:0;object-fit:cover;border-radius:8px" referrerpolicy="no-referrer" />
        <div style="min-width:0;flex:1">
          <div style="font-weight:700;color:#e03131;font-size:14px;line-height:1.2">${escape(formatPrice(p.price, p.priceUnit))}</div>
          <div style="font-size:12px;font-weight:600;color:#111827;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escape(p.title)}</div>
          <div style="font-size:11px;color:#6b7280;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escape(String(p.area))} m²${p.location ? ` · ${escape(p.location)}` : ''}</div>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>
      </a>`;
    const popup = new maplibregl.Popup({ offset: 24, closeButton: false, maxWidth: '280px', className: 'bds-mini-card' })
      .setLngLat([p.longitude as number, p.latitude as number])
      .setHTML(html)
      .addTo(map);
    popupRef.current = popup;

    // Điều hướng nội bộ khi cha có xử lý; không có thì thẻ <a> vẫn mở trang bình thường.
    const anchor = popup.getElement()?.querySelector('a[data-property-id]');
    anchor?.addEventListener('click', (e) => {
      if (!onOpenRef.current) return;
      e.preventDefault();
      onOpenRef.current(p.id);
    });
  }

  if (!GOONG_API_KEY) {
    return (
      <div className={`flex items-center justify-center bg-gray-50 text-sm text-gray-500 ${className}`}>
        Thiếu cấu hình bản đồ.
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div ref={containerRef} className="h-full w-full" />
      {showLayerSwitch && (
        <div className="absolute bottom-[76px] left-3 z-10 flex gap-1.5 rounded-xl border border-gray-200 bg-white p-1.5 shadow-md md:bottom-4 md:left-4">
          {(Object.keys(LAYERS) as LayerKind[]).map((kind) => {
            const { label, Icon } = LAYERS[kind];
            const selected = layer === kind;
            return (
              <button
                key={kind}
                type="button"
                onClick={() => setLayer(kind)}
                aria-pressed={selected}
                className={`flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[12px] font-semibold transition-colors ${
                  selected ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className={`flex h-6 w-6 items-center justify-center rounded-md ${selected ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'}`}>
                  <Icon className="h-3.5 w-3.5" />
                </span>
                {label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Lớp nhiệt "Giá": mỗi tin là một điểm, trọng số = giá mỗi m² chuẩn hoá về 0..1 trong tập kết
 * quả đang xem (vùng đỏ = đắt hơn các tin xung quanh). Truyền mảng rỗng để gỡ lớp.
 * Lưu ý: dữ liệu càng thưa thì bản đồ nhiệt càng chỉ là vài đốm rời.
 */
function updatePriceHeat(map: maplibregl.Map, properties: MapProperty[]) {
  if (map.getLayer(PRICE_LAYER_ID)) map.removeLayer(PRICE_LAYER_ID);
  if (map.getSource(PRICE_SOURCE_ID)) map.removeSource(PRICE_SOURCE_ID);

  const points = properties
    .filter((p) => p.latitude != null && p.longitude != null && p.area > 0)
    .map((p) => {
      const { perM2 } = derivePrices(p.price, p.priceUnit, p.area);
      return { p, perM2: perM2 ?? p.price / p.area };
    })
    .filter(({ perM2 }) => Number.isFinite(perM2) && perM2 > 0);
  if (points.length === 0) return;

  const values = points.map(({ perM2 }) => perM2);
  const min = Math.min(...values);
  const span = Math.max(...values) - min || 1;

  map.addSource(PRICE_SOURCE_ID, {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: points.map(({ p, perM2 }) => ({
        type: 'Feature' as const,
        properties: { weight: 0.2 + 0.8 * ((perM2 - min) / span) },
        geometry: { type: 'Point' as const, coordinates: [p.longitude as number, p.latitude as number] },
      })),
    },
  });
  map.addLayer({
    id: PRICE_LAYER_ID,
    type: 'heatmap',
    source: PRICE_SOURCE_ID,
    paint: {
      'heatmap-weight': ['get', 'weight'],
      'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 8, 25, 14, 60],
      'heatmap-intensity': 1,
      'heatmap-opacity': 0.7,
      'heatmap-color': [
        'interpolate', ['linear'], ['heatmap-density'],
        0, 'rgba(16,117,177,0)',
        0.3, 'rgba(16,117,177,0.45)',
        0.6, 'rgba(250,176,5,0.7)',
        1, 'rgba(224,49,49,0.85)',
      ],
    },
  });
}
