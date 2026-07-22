'use client';

import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, LocateFixed, Search } from 'lucide-react';

interface SearchResult {
  lat: number;
  lng: number;
  display_name: string;
  in_coverage: boolean;
}

interface MapPickerProps {
  value?: { lat: number; lng: number };
  onChange?: (value: { lat: number; lng: number }) => void;
  /** Toạ độ căn giữa khi chưa chọn điểm nào — dùng để dời bản đồ theo xã/phường đã chọn. */
  center?: [number, number];
  height?: string;
  className?: string;
  disabled?: boolean;
}

const QUANG_NGAI: [number, number] = [108.7922, 15.1212]; // MapLibre dùng [lng, lat]

const GOONG_API_KEY = process.env.NEXT_PUBLIC_GOONG_API_KEY ?? '';
const GOONG_STYLE_URL = `https://tiles.goong.io/assets/goong_map_web.json?api_key=${GOONG_API_KEY}`;

/**
 * Ghim đỏ giống hệt bản Leaflet/Google Maps trước — SVG inline, tự dựng bằng DOM element vì
 * MapLibre Marker nhận thẳng HTMLElement thay vì icon URL.
 */
function createPinElement() {
  const el = document.createElement('div');
  el.innerHTML = `<svg width="30" height="42" viewBox="0 0 30 42" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 0C6.7 0 0 6.7 0 15c0 11 15 27 15 27s15-16 15-27c0-8.3-6.7-15-15-15z" fill="#e03131"/>
    <circle cx="15" cy="15" r="5.5" fill="#fff"/>
  </svg>`;
  el.style.cursor = 'grab';
  return el;
}

export function MapPicker({
  value,
  onChange,
  center,
  height = '320px',
  className = '',
  disabled = false,
}: MapPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);

  // onChange đi qua ref để hiệu ứng khởi tạo bản đồ không phụ thuộc vào nó. Nếu đưa thẳng
  // onChange vào deps, mỗi lần cha render lại là bản đồ bị dựng lại từ đầu.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const searchBoxRef = useRef<HTMLDivElement>(null);

  /** Đặt lại vị trí ghim, tạo mới nếu chưa có. Không đụng tới khung nhìn của bản đồ. */
  const placeMarker = (map: maplibregl.Map, lat: number, lng: number) => {
    if (markerRef.current) {
      markerRef.current.setLngLat([lng, lat]);
      return;
    }
    const marker = new maplibregl.Marker({ element: createPinElement(), draggable: true, anchor: 'bottom' })
      .setLngLat([lng, lat])
      .addTo(map);
    marker.on('dragend', () => {
      const p = marker.getLngLat();
      onChangeRef.current?.({ lat: p.lat, lng: p.lng });
    });
    markerRef.current = marker;
  };

  // Khởi tạo bản đồ ĐÚNG MỘT LẦN. Trước đây hiệu ứng này phụ thuộc `value`, nên mỗi lần
  // người dùng bấm chọn điểm là bản đồ bị huỷ rồi dựng lại — mất cả mức phóng to lẫn vị trí
  // đang xem, nhìn như bản đồ bị giật về chỗ cũ.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    if (!GOONG_API_KEY) {
      setLoadError('Thiếu NEXT_PUBLIC_GOONG_API_KEY — chưa cấu hình bản đồ.');
      return;
    }

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: GOONG_STYLE_URL,
      center: value ? [value.lng, value.lat] : QUANG_NGAI,
      zoom: value ? 16 : 12,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    map.on('error', () => setLoadError('Không tải được bản đồ. Kiểm tra lại API key Goong.'));

    map.on('click', (e) => {
      placeMarker(map, e.lngLat.lat, e.lngLat.lng);
      onChangeRef.current?.({ lat: e.lngLat.lat, lng: e.lngLat.lng });
    });

    if (value) placeMarker(map, value.lat, value.lng);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- cố ý chỉ chạy 1 lần

  // Toạ độ do bên ngoài đổi (ví dụ người dùng chọn lại xã/phường) thì dời ghim theo, nhưng
  // không dựng lại bản đồ.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !value) return;
    placeMarker(map, value.lat, value.lng);
    map.setZoom(Math.max(map.getZoom(), 16));
    map.setCenter([value.lng, value.lat]);
  }, [value?.lat, value?.lng]); // eslint-disable-line react-hooks/exhaustive-deps

  // Chưa ghim điểm nào mà cha đổi vùng trung tâm (chọn xã/phường trước) thì dời khung nhìn.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !center || value) return;
    map.setCenter([center[1], center[0]]);
    map.setZoom(14);
  }, [center?.[0], center?.[1]]); // eslint-disable-line react-hooks/exhaustive-deps

  // Đóng dropdown khi bấm ra ngoài hoặc nhấn Esc.
  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowResults(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  /** Tra cứu và hiện danh sách gợi ý — KHÔNG tự ghim, để người dùng chọn đúng địa chỉ mình cần. */
  const handleSearch = async () => {
    const q = searchQuery.trim();
    if (!q || isSearching) return;

    setIsSearching(true);
    setSearchError(null);
    try {
      const res = await fetch(`/api/v2/geocode/search?q=${encodeURIComponent(q)}`);
      const json = await res.json();
      const results: SearchResult[] = json?.data ?? [];
      if (results.length === 0) {
        setSearchError('Không tìm thấy địa điểm này. Thử tên đường hoặc tên xã/phường.');
        setSearchResults([]);
        setShowResults(false);
        return;
      }
      setSearchResults(results);
      setShowResults(true);
    } catch {
      setSearchError('Không tìm kiếm được, vui lòng thử lại.');
    } finally {
      setIsSearching(false);
    }
  };

  /** Người dùng chọn một địa chỉ trong danh sách gợi ý — lúc này mới thật sự ghim. */
  const handleSelectResult = (hit: SearchResult) => {
    const map = mapRef.current;
    if (map) {
      placeMarker(map, hit.lat, hit.lng);
      map.setCenter([hit.lng, hit.lat]);
      map.setZoom(17);
    }
    onChangeRef.current?.({ lat: hit.lat, lng: hit.lng });
    setSearchQuery(hit.display_name);
    setShowResults(false);
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setSearchError('Trình duyệt không hỗ trợ định vị.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const map = mapRef.current;
        if (map) {
          placeMarker(map, latitude, longitude);
          map.setCenter([longitude, latitude]);
          map.setZoom(17);
        }
        onChangeRef.current?.({ lat: latitude, lng: longitude });
      },
      () => setSearchError('Không lấy được vị trí. Kiểm tra quyền truy cập vị trí của trình duyệt.')
    );
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div ref={searchBoxRef} className="relative flex gap-2">
        <Input
          placeholder="Tìm theo tên đường, xã/phường..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => searchResults.length > 0 && setShowResults(true)}
          // Enter trong ô này phải tìm kiếm, không được submit cả form đăng tin.
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSearch();
            }
          }}
          disabled={disabled}
          className="flex-1"
        />
        {/* type="button" là bắt buộc: thiếu nó, nút mặc định là submit và sẽ gửi cả form. */}
        <Button type="button" variant="outline" onClick={handleSearch} disabled={disabled || isSearching}>
          {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </Button>
        <Button type="button" variant="outline" onClick={handleLocateMe} disabled={disabled} title="Vị trí của tôi">
          <LocateFixed className="h-4 w-4" />
        </Button>

        {/* Danh sách gợi ý — backend trả tối đa 5 kết quả, kết quả trong Quảng Ngãi xếp trước. */}
        {showResults && searchResults.length > 0 && (
          <ul className="absolute left-0 right-0 top-full z-10 mt-1 max-h-64 overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
            {searchResults.map((r, i) => (
              <li key={`${r.lat},${r.lng},${i}`}>
                <button
                  type="button"
                  onClick={() => handleSelectResult(r)}
                  className="block w-full px-3 py-2 text-left text-[13px] text-gray-700 hover:bg-primary-light hover:text-primary"
                >
                  {r.display_name}
                  {!r.in_coverage && (
                    <span className="ml-1.5 text-[11px] text-gray-400">(ngoài Quảng Ngãi)</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {searchError && <p className="text-[13px] text-red-600">{searchError}</p>}
      {loadError && <p className="text-[13px] text-red-600">{loadError}</p>}

      <div
        ref={containerRef}
        style={{ height }}
        className="rounded-lg overflow-hidden border border-gray-200 z-0 bg-gray-100"
      />

      <p className="text-[13px] text-gray-500">
        Bấm lên bản đồ hoặc kéo ghim để chọn đúng vị trí bất động sản.
      </p>
    </div>
  );
}
