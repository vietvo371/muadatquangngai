'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, LocateFixed, Search } from 'lucide-react';

interface MapPickerProps {
  value?: { lat: number; lng: number };
  onChange?: (value: { lat: number; lng: number }) => void;
  /** Toạ độ căn giữa khi chưa chọn điểm nào — dùng để dời bản đồ theo xã/phường đã chọn. */
  center?: [number, number];
  height?: string;
  className?: string;
  disabled?: boolean;
}

const QUANG_NGAI: [number, number] = [15.1212, 108.7922];

/**
 * Leaflet không tự nạp được ảnh ghim khi đóng gói qua bundler (đường dẫn ảnh trong CSS trỏ
 * tương đối vào node_modules). Tự dựng ghim bằng SVG inline để không phụ thuộc file ảnh.
 */
const PIN_ICON = L.divIcon({
  className: '',
  html: `<svg width="30" height="42" viewBox="0 0 30 42" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 0C6.7 0 0 6.7 0 15c0 11 15 27 15 27s15-16 15-27c0-8.3-6.7-15-15-15z" fill="#e03131"/>
    <circle cx="15" cy="15" r="5.5" fill="#fff"/>
  </svg>`,
  iconSize: [30, 42],
  iconAnchor: [15, 42],
});

export function MapPicker({
  value,
  onChange,
  center,
  height = '320px',
  className = '',
  disabled = false,
}: MapPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // onChange đi qua ref để hiệu ứng khởi tạo bản đồ không phụ thuộc vào nó. Nếu đưa thẳng
  // onChange vào deps, mỗi lần cha render lại là bản đồ bị dựng lại từ đầu.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  /** Đặt lại vị trí ghim, tạo mới nếu chưa có. Không đụng tới khung nhìn của bản đồ. */
  const placeMarker = (map: L.Map, lat: number, lng: number) => {
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
      return;
    }
    const marker = L.marker([lat, lng], { icon: PIN_ICON, draggable: true }).addTo(map);
    marker.on('dragend', (e) => {
      const p = (e.target as L.Marker).getLatLng();
      onChangeRef.current?.({ lat: p.lat, lng: p.lng });
    });
    markerRef.current = marker;
  };

  // Khởi tạo bản đồ ĐÚNG MỘT LẦN. Trước đây hiệu ứng này phụ thuộc `value`, nên mỗi lần
  // người dùng bấm chọn điểm là bản đồ bị huỷ rồi dựng lại — mất cả mức phóng to lẫn vị trí
  // đang xem, nhìn như bản đồ bị giật về chỗ cũ.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current).setView(value ? [value.lat, value.lng] : QUANG_NGAI, value ? 16 : 12);
    // CartoDB Voyager — cùng loại tile với trang /ban-do, miễn phí không cần API key, nhìn
    // hiện đại hơn hẳn tile OSM thô (màu sắc rõ ràng, tên đường dễ đọc).
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      maxZoom: 19,
    }).addTo(map);

    map.on('click', (e: L.LeafletMouseEvent) => {
      placeMarker(map, e.latlng.lat, e.latlng.lng);
      onChangeRef.current?.({ lat: e.latlng.lat, lng: e.latlng.lng });
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
    map.setView([value.lat, value.lng], Math.max(map.getZoom(), 16));
  }, [value?.lat, value?.lng]); // eslint-disable-line react-hooks/exhaustive-deps

  // Chưa ghim điểm nào mà cha đổi vùng trung tâm (chọn xã/phường trước) thì dời khung nhìn.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !center || value) return;
    map.setView(center, 14);
  }, [center?.[0], center?.[1]]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = async () => {
    const q = searchQuery.trim();
    if (!q || isSearching) return;

    setIsSearching(true);
    setSearchError(null);
    try {
      const res = await fetch(`/api/v2/geocode/search?q=${encodeURIComponent(q)}`);
      const json = await res.json();
      const hit = json?.data?.[0];
      if (!hit) {
        setSearchError('Không tìm thấy địa điểm này. Thử tên đường hoặc tên xã/phường.');
        return;
      }
      const map = mapRef.current;
      if (map) {
        placeMarker(map, hit.lat, hit.lng);
        map.setView([hit.lat, hit.lng], 17);
      }
      onChangeRef.current?.({ lat: hit.lat, lng: hit.lng });
    } catch {
      setSearchError('Không tìm kiếm được, vui lòng thử lại.');
    } finally {
      setIsSearching(false);
    }
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
          map.setView([latitude, longitude], 17);
        }
        onChangeRef.current?.({ lat: latitude, lng: longitude });
      },
      () => setSearchError('Không lấy được vị trí. Kiểm tra quyền truy cập vị trí của trình duyệt.')
    );
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex gap-2">
        <Input
          placeholder="Tìm theo tên đường, xã/phường..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
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
      </div>

      {searchError && <p className="text-[13px] text-red-600">{searchError}</p>}

      <div
        ref={containerRef}
        style={{ height }}
        className="rounded-lg overflow-hidden border border-gray-200 z-0"
      />

      <p className="text-[13px] text-gray-500">
        Bấm lên bản đồ hoặc kéo ghim để chọn đúng vị trí bất động sản.
      </p>
    </div>
  );
}
