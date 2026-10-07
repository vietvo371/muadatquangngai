'use client';

import { useEffect, useRef, useState } from 'react';
import { googleStreetViewEmbedUrl } from '@/lib/google-embed';

/**
 * Ảnh bìa cho hai ô "Bản đồ" và "Đường phố" trên thanh Thumbnail Media (Notion 06/10
 * "Thumbnail Media – Ảnh bìa Bản đồ & Đường phố").
 *
 * Yêu cầu gốc gợi ý Google Static Maps / Street View Static API — cả hai bắt buộc gắn thẻ thanh
 * toán, khách đã chốt KHÔNG gắn. Làm bằng thứ dự án có sẵn:
 *
 *  - Bản đồ: dựng bản đồ Goong (đang dùng ở trang danh sách) trong một khung ẩn, chờ vẽ xong thì
 *    chụp canvas thành ảnh JPEG rồi gỡ bản đồ đi. Kết quả là một ảnh tĩnh nhẹ — không giữ một
 *    bản đồ WebGL sống chỉ để làm hình nền.
 *  - Đường phố: không có cách nào lấy ảnh tĩnh miễn phí, nên nhúng khung Street View không cần
 *    khoá (giống tab "Đường phố") rồi thu nhỏ, chặn mọi thao tác chuột trên khung.
 *
 * Cả hai chỉ tải khi ô sắp cuộn vào màn hình. Lỗi hay quá lâu thì giữ nguyên nền tối + biểu
 * tượng như trước — không bao giờ để ô vỡ.
 */

const GOONG_API_KEY = process.env.NEXT_PUBLIC_GOONG_API_KEY ?? '';
const MAP_STYLE = `https://tiles.goong.io/assets/goong_map_web.json?api_key=${GOONG_API_KEY}`;
/** Khung chụp gấp đôi ô hiển thị (140px) để ảnh nét trên màn hình mật độ điểm ảnh cao. */
const SNAPSHOT_SIZE = 280;
const SNAPSHOT_TIMEOUT_MS = 10_000;
// 16: đủ gần để thấy tên đường quanh tin; 15 ở vùng ven chỉ còn một mảng xanh trơn.
const ZOOM = 16;

/** Ảnh đã chụp theo toạ độ — quay lại trang hay dựng lại component thì khỏi chụp lần nữa. */
const snapshotCache = new Map<string, string>();

function useNearViewport<T extends Element>() {
  const ref = useRef<T>(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || near) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setNear(true);
      },
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [near]);
  return { ref, near };
}

async function snapshotGoongMap(lat: number, lng: number): Promise<string> {
  const { default: maplibregl } = await import('maplibre-gl');
  const host = document.createElement('div');
  // Đặt ngoài màn hình nhưng vẫn có kích thước thật — bản đồ cần khung có kích thước mới vẽ được.
  Object.assign(host.style, {
    position: 'fixed',
    left: '-10000px',
    top: '0',
    width: `${SNAPSHOT_SIZE}px`,
    height: `${SNAPSHOT_SIZE}px`,
    pointerEvents: 'none',
  });
  document.body.appendChild(host);

  const map = new maplibregl.Map({
    container: host,
    style: MAP_STYLE,
    center: [lng, lat],
    zoom: ZOOM,
    interactive: false,
    attributionControl: false,
    fadeDuration: 0,
    // Bắt buộc để đọc được nội dung canvas sau khi vẽ (toDataURL).
    canvasContextAttributes: { preserveDrawingBuffer: true },
  });

  try {
    return await new Promise<string>((resolve, reject) => {
      const timer = window.setTimeout(() => reject(new Error('Bản đồ vẽ quá lâu')), SNAPSHOT_TIMEOUT_MS);
      map.once('error', (e) => {
        window.clearTimeout(timer);
        reject(e.error ?? new Error('Không tải được bản đồ'));
      });
      map.once('idle', () => {
        window.clearTimeout(timer);
        try {
          resolve(map.getCanvas().toDataURL('image/jpeg', 0.82));
        } catch (err) {
          reject(err);
        }
      });
    });
  } finally {
    map.remove();
    host.remove();
  }
}

export function MapSnapshotCover({ lat, lng }: { lat: number; lng: number }) {
  const key = `${lat.toFixed(5)},${lng.toFixed(5)}`;
  const { ref, near } = useNearViewport<HTMLDivElement>();
  const [src, setSrc] = useState<string | null>(() => snapshotCache.get(key) ?? null);

  useEffect(() => {
    if (!near || src || !GOONG_API_KEY) return;
    let cancelled = false;
    snapshotGoongMap(lat, lng)
      .then((dataUrl) => {
        snapshotCache.set(key, dataUrl);
        if (!cancelled) setSrc(dataUrl);
      })
      .catch(() => {
        // Giữ nền tối + biểu tượng; ô vẫn bấm được để mở bản đồ thật.
      });
    return () => {
      cancelled = true;
    };
  }, [near, src, key, lat, lng]);

  return (
    <div ref={ref} className="absolute inset-0">
      {src && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- ảnh data: chụp tại chỗ, next/image không xử lý được */}
          <img src={src} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
        </>
      )}
    </div>
  );
}

export function StreetViewCover({ lat, lng }: { lat: number; lng: number }) {
  const { ref, near } = useNearViewport<HTMLDivElement>();
  const [loaded, setLoaded] = useState(false);

  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden">
      {near && (
        // Khung dựng ở 400% rồi thu về 50% (= 200% ô) và căn giữa: phần thừa bị cắt chính là
        // dải mép chứa thẻ địa chỉ, nút xoay, nút phóng to và chân trang của Google — ô chỉ còn
        // lại phần ảnh đường phố ở giữa. pointer-events-none để bấm vào ô vẫn mở album như cũ.
        <iframe
          title=""
          aria-hidden
          tabIndex={-1}
          src={googleStreetViewEmbedUrl(lat, lng)}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          onLoad={() => setLoaded(true)}
          className={`pointer-events-none absolute left-1/2 top-1/2 h-[400%] w-[400%] -translate-x-1/2 -translate-y-1/2 scale-50 border-0 transition-opacity duration-300 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </div>
  );
}
