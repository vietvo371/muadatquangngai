'use client';

import { useEffect, useRef, useState } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize, Minimize } from 'lucide-react';

interface PropertyImageSliderProps {
  /** Danh sách URL ảnh phẳng (đã fallback thumbnail). */
  media: string[];
  index: number;
  onIndexChange: (next: number) => void;
  onClose: () => void;
  /** z-index lớp phủ — album ảnh nằm dưới, slider nằm trên. */
  zIndexClassName?: string;
}

/**
 * Slider 1 ảnh toàn màn hình (zoom + pan + fullscreen + phím ←/→/Esc + vuốt cảm ứng).
 * Tách ra từ lightbox của `PropertyMediaSection` (Đợt 4) để dùng lại được ở cả album
 * "Xem tất cả ảnh" — hành vi giữ nguyên, tự viết, không dùng thư viện ngoài.
 */
export function PropertyImageSlider({
  media,
  index,
  onIndexChange,
  onClose,
  zIndexClassName = 'z-[9999]',
}: PropertyImageSliderProps) {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;

  const [zoomScale, setZoomScale] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panStateRef = useRef<{ dragging: boolean; startX: number; startY: number; originX: number; originY: number }>({
    dragging: false,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
  });
  const MAX_ZOOM = 3;

  const resetZoom = () => {
    setZoomScale(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const toggleZoom = () => {
    if (zoomScale > 1) resetZoom();
    else setZoomScale(2);
  };

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      rootRef.current?.requestFullscreen().catch(() => {
        // Trình duyệt/thiết bị không hỗ trợ Fullscreen API — bỏ qua, không chặn zoom/xem ảnh.
      });
    }
  };

  const close = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    resetZoom();
    onClose();
  };

  const goPrev = () => {
    resetZoom();
    onIndexChange((index - 1 + media.length) % media.length);
  };
  const goNext = () => {
    resetZoom();
    onIndexChange((index + 1) % media.length);
  };

  useEffect(() => {
    if (media.length === 0) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ cần gắn lại khi đổi ảnh/độ dài album
  }, [media, index]);

  if (media.length === 0) return null;

  const handlePrevClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    goPrev();
  };
  const handleNextClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    goNext();
  };

  // Đã zoom thì chạm để KÉO ẢNH, không phải vuốt chuyển ảnh — 2 thao tác dễ nhầm nếu dùng
  // chung 1 cử chỉ chạm.
  const handleTouchStart = (e: React.TouchEvent) => {
    if (zoomScale > 1) {
      const t = e.targetTouches[0];
      panStateRef.current = { dragging: true, startX: t.clientX, startY: t.clientY, originX: panOffset.x, originY: panOffset.y };
      return;
    }
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (zoomScale > 1 && panStateRef.current.dragging) {
      const t = e.targetTouches[0];
      setPanOffset({
        x: panStateRef.current.originX + (t.clientX - panStateRef.current.startX) / zoomScale,
        y: panStateRef.current.originY + (t.clientY - panStateRef.current.startY) / zoomScale,
      });
      return;
    }
    setTouchEnd(e.targetTouches[0].clientX);
  };
  const handleTouchEnd = () => {
    if (zoomScale > 1) {
      panStateRef.current.dragging = false;
      return;
    }
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > minSwipeDistance) goNext();
    else if (distance < -minSwipeDistance) goPrev();
  };

  // Cuộn chuột để zoom, con lăn xuống thì thu nhỏ dần về 1x.
  const handleWheel = (e: React.WheelEvent) => {
    setZoomScale((prev) => {
      const next = Math.min(MAX_ZOOM, Math.max(1, prev - e.deltaY * 0.002));
      if (next === 1) setPanOffset({ x: 0, y: 0 });
      return next;
    });
  };

  // Kéo ảnh khi đã zoom (chuột) — desktop; cảm ứng xử lý riêng ở touch handlers.
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomScale <= 1) return;
    panStateRef.current = { dragging: true, startX: e.clientX, startY: e.clientY, originX: panOffset.x, originY: panOffset.y };
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!panStateRef.current.dragging) return;
    setPanOffset({
      x: panStateRef.current.originX + (e.clientX - panStateRef.current.startX) / zoomScale,
      y: panStateRef.current.originY + (e.clientY - panStateRef.current.startY) / zoomScale,
    });
  };
  const handleMouseUp = () => {
    panStateRef.current.dragging = false;
  };

  return (
    <div
      ref={rootRef}
      className={`fixed inset-0 ${zIndexClassName} bg-black/95 backdrop-blur-sm flex flex-col justify-between p-4 select-none animate-in fade-in duration-200`}
      onClick={close}
    >
      <div className="flex items-center justify-between w-full max-w-7xl mx-auto z-10 pt-2">
        <span className="text-white/80 text-sm font-semibold tracking-wider">
          {index + 1} / {media.length}
        </span>
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setZoomScale((s) => Math.max(1, s - 0.5))}
            disabled={zoomScale <= 1}
            className="text-white/80 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors bg-white/10 hover:bg-white/20 p-2.5 rounded-full"
            aria-label="Thu nhỏ"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={toggleZoom}
            className="text-white/80 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-2.5 rounded-full"
            aria-label="Phóng to"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={toggleFullscreen}
            className="text-white/80 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-2.5 rounded-full"
            aria-label={isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
          <button
            onClick={close}
            className="text-white/80 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-2.5 rounded-full"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-center w-full max-w-7xl mx-auto flex-1 my-4 relative">
        <div
          className="relative flex-1 max-w-5xl h-[65vh] md:h-[75vh] flex items-center justify-center mx-2 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {zoomScale === 1 && media.length > 1 && (
            <button
              onClick={handlePrevClick}
              className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 flex items-center justify-center bg-black/50 hover:bg-black/75 text-white p-2.5 md:p-3.5 rounded-full transition-all hover:scale-105 active:scale-95 z-20 shadow-lg border border-white/10"
              aria-label="Ảnh trước"
            >
              <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={media[index]}
            alt={`Slide ${index + 1}`}
            onDoubleClick={toggleZoom}
            draggable={false}
            style={{
              transform: `scale(${zoomScale}) translate(${panOffset.x}px, ${panOffset.y}px)`,
              transition: panStateRef.current.dragging ? 'none' : 'transform 0.2s ease-out',
              cursor: zoomScale > 1 ? 'grab' : 'zoom-in',
            }}
            className="max-h-full max-w-full object-contain rounded-xl shadow-2xl animate-in zoom-in-95 duration-200"
          />

          {zoomScale === 1 && media.length > 1 && (
            <button
              onClick={handleNextClick}
              className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 flex items-center justify-center bg-black/50 hover:bg-black/75 text-white p-2.5 md:p-3.5 rounded-full transition-all hover:scale-105 active:scale-95 z-20 shadow-lg border border-white/10"
              aria-label="Ảnh sau"
            >
              <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          )}
        </div>
      </div>

      <div className="w-full max-w-4xl mx-auto z-10 pb-2">
        <div className="md:hidden flex justify-center items-center px-4 mb-2">
          <span className="text-[12px] text-white/40 font-medium text-center">
            {zoomScale > 1 ? 'Kéo để xem ảnh, bấm đúp để thu nhỏ' : 'Vuốt sang trái/phải hoặc dùng nút để chuyển ảnh'}
          </span>
        </div>
        <div className="hidden md:flex justify-center gap-2.5 overflow-x-auto py-2 max-w-full scrollbar-hide">
          {media.map((img, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                resetZoom();
                onIndexChange(idx);
              }}
              className={`relative w-20 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                idx === index ? 'border-[#1075b1] scale-105 shadow-md' : 'border-transparent opacity-50 hover:opacity-90'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
