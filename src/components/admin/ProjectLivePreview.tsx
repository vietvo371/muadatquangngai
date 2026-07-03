'use client';

import React, { useEffect, useMemo, useRef } from 'react';

/**
 * Dữ liệu nháp từ form quản trị — cùng shape với ProjectPreview cũ.
 */
export interface LivePreviewData {
  name: string;
  slug: string;
  investor: string;
  type: string;
  min_price: number;
  max_price: number;
  total_area: number;
  total_units: number;
  total_blocks: number;
  total_floors: number;
  legal: string;
  handover_date: string;
  construction_progress: number;
  construction_note?: string;
  location: string;
  description: string;
  utilities: string[];
  status: string;
  images?: string[];
  agentName?: string;
  agentTitle?: string;
  floor_plans?: Array<{ type: string; area: string; count: number; priceFrom: number }>;
}

/**
 * Chuyển dữ liệu form sang đúng "hình dạng API" mà trang du-an dùng,
 * để iframe chạy chính mapping + JSX thật của trang chi tiết (parity tuyệt đối).
 */
function toApiShape(d: LivePreviewData) {
  const images = (d.images || []).filter(Boolean);
  return {
    id: 'preview',
    slug: d.slug || 'preview',
    name: d.name || 'Tên dự án',
    developer: d.investor || 'Chưa cập nhật',
    description: d.description || '',
    type: d.type || 'townhouse',
    status: d.status || 'selling',
    images,
    thumbnail: images[0] || undefined,
    location: { address: d.location || '' },
    scale: {
      total_area: d.total_area || 0,
      total_units: d.total_units || 0,
      total_blocks: d.total_blocks || 0,
      total_floors: d.total_floors || 0,
    },
    price: { from: d.min_price || 0, to: d.max_price || 0 },
    legal: d.legal || 'Đang cập nhật',
    handover_date: d.handover_date || '',
    construction_progress: d.construction_progress || 0,
    construction_note: d.construction_note || '',
    utilities: Array.isArray(d.utilities) ? d.utilities : [],
    floor_plans: d.floor_plans && d.floor_plans.length > 0 ? d.floor_plans : null,
    agent: d.agentName ? { name: d.agentName, title: d.agentTitle, phone: '' } : null,
    related_listings: [],
  };
}

export default function ProjectLivePreview({ data }: { data: LivePreviewData }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const payload = useMemo(() => toApiShape(data), [data]);

  const post = () => {
    iframeRef.current?.contentWindow?.postMessage(
      { type: 'project-preview', payload },
      window.location.origin
    );
  };

  // Nhận tín hiệu iframe sẵn sàng rồi mới gửi dữ liệu lần đầu
  useEffect(() => {
    const onReady = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type === 'preview-ready') {
        post();
      }
    };
    window.addEventListener('message', onReady);
    return () => window.removeEventListener('message', onReady);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mỗi lần dữ liệu form đổi, gửi lại. Nếu iframe chưa load xong thì
  // message bị bỏ qua, nhưng onLoad + handshake 'preview-ready' sẽ gửi lại
  // bản mới nhất — nên luôn post an toàn.
  useEffect(() => {
    post();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payload]);

  return (
    <div className="sticky top-6 rounded-2xl border border-gray-200 bg-gray-50 shadow-md overflow-hidden">
      {/* Mock Browser Header */}
      <div className="bg-gray-100/90 px-4 py-3 border-b border-gray-200 flex items-center gap-3 shrink-0 select-none">
        <div className="flex gap-1.5 shrink-0">
          <span className="w-3.5 h-3.5 rounded-full bg-red-400" />
          <span className="w-3.5 h-3.5 rounded-full bg-amber-400" />
          <span className="w-3.5 h-3.5 rounded-full bg-green-400" />
        </div>
        <div className="bg-white rounded-lg px-3 py-1 flex-1 text-center text-[11px] font-semibold text-gray-400 border border-gray-200/60 truncate shadow-xs select-none max-w-sm mx-auto">
          https://batdongsanquangngai.vn/du-an/{data.slug || 'slug-du-an'}
        </div>
        <span className="text-[10px] font-extrabold text-primary border border-primary/20 px-2 py-0.5 rounded bg-primary/5 select-none shrink-0 uppercase tracking-wider">
          LIVE PREVIEW
        </span>
      </div>

      {/* Iframe render đúng trang du-an thật ở chế độ preview */}
      <iframe
        ref={iframeRef}
        src="/du-an/preview?preview=1"
        title="Xem trước trang dự án"
        className="w-full bg-white"
        style={{ height: '78vh', border: 0 }}
        onLoad={post}
      />
    </div>
  );
}
