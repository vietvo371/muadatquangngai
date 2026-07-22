'use client';

import { useEffect, useRef, useState } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
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

const QUANG_NGAI = { lat: 15.1212, lng: 108.7922 };

/** Ghim đỏ giống hệt trước — SVG inline qua data URI thay vì icon mặc định của Google. */
const PIN_ICON = {
  url:
    'data:image/svg+xml;charset=UTF-8,' +
    encodeURIComponent(
      `<svg width="30" height="42" viewBox="0 0 30 42" xmlns="http://www.w3.org/2000/svg">
        <path d="M15 0C6.7 0 0 6.7 0 15c0 11 15 27 15 27s15-16 15-27c0-8.3-6.7-15-15-15z" fill="#e03131"/>
        <circle cx="15" cy="15" r="5.5" fill="#fff"/>
      </svg>`
    ),
  scaledSize: { width: 30, height: 42 } as google.maps.Size,
  anchor: { x: 15, y: 42 } as google.maps.Point,
};

// setOptions() chỉ có tác dụng ở lần gọi đầu — các MapPicker khác trên trang gọi lại cũng
// không sao vì importLibrary() tự cache, không tải lại script.
setOptions({ key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '', v: 'weekly' });

export function MapPicker({
  value,
  onChange,
  center,
  height = '320px',
  className = '',
  disabled = false,
}: MapPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);

  // onChange đi qua ref để hiệu ứng khởi tạo bản đồ không phụ thuộc vào nó. Nếu đưa thẳng
  // onChange vào deps, mỗi lần cha render lại là bản đồ bị dựng lại từ đầu.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  /** Đặt lại vị trí ghim, tạo mới nếu chưa có. Không đụng tới khung nhìn của bản đồ. */
  const placeMarker = (map: google.maps.Map, lat: number, lng: number) => {
    if (markerRef.current) {
      markerRef.current.setPosition({ lat, lng });
      return;
    }
    const marker = new google.maps.Marker({ position: { lat, lng }, map, icon: PIN_ICON, draggable: true });
    marker.addListener('dragend', () => {
      const p = marker.getPosition();
      if (p) onChangeRef.current?.({ lat: p.lat(), lng: p.lng() });
    });
    markerRef.current = marker;
  };

  // Khởi tạo bản đồ ĐÚNG MỘT LẦN. Trước đây hiệu ứng này phụ thuộc `value`, nên mỗi lần
  // người dùng bấm chọn điểm là bản đồ bị huỷ rồi dựng lại — mất cả mức phóng to lẫn vị trí
  // đang xem, nhìn như bản đồ bị giật về chỗ cũ.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let cancelled = false;

    importLibrary('maps')
      .then(({ Map }) => {
        if (cancelled || !containerRef.current || mapRef.current) return;

        const map = new Map(containerRef.current, {
          center: value ?? QUANG_NGAI,
          zoom: value ? 16 : 12,
          streetViewControl: false,
          fullscreenControl: false,
        });

        map.addListener('click', (e: google.maps.MapMouseEvent) => {
          if (!e.latLng) return;
          placeMarker(map, e.latLng.lat(), e.latLng.lng());
          onChangeRef.current?.({ lat: e.latLng.lat(), lng: e.latLng.lng() });
        });

        if (value) placeMarker(map, value.lat, value.lng);
        mapRef.current = map;
      })
      .catch(() => setLoadError('Không tải được Google Maps. Kiểm tra lại API key.'));

    return () => {
      cancelled = true;
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
    map.setZoom(Math.max(map.getZoom() ?? 12, 16));
    map.setCenter(value);
  }, [value?.lat, value?.lng]); // eslint-disable-line react-hooks/exhaustive-deps

  // Chưa ghim điểm nào mà cha đổi vùng trung tâm (chọn xã/phường trước) thì dời khung nhìn.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !center || value) return;
    map.setCenter({ lat: center[0], lng: center[1] });
    map.setZoom(14);
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
        map.setCenter({ lat: hit.lat, lng: hit.lng });
        map.setZoom(17);
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
          map.setCenter({ lat: latitude, lng: longitude });
          map.setZoom(17);
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
