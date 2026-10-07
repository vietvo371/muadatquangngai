'use client';

import { useEffect, useState } from 'react';
import { Map as MapIcon } from 'lucide-react';
import { BREAKPOINTS } from '@/lib/design-tokens';

/**
 * Nút "Xem bản đồ" nổi giữa cạnh dưới trang danh sách (Notion 06/10 "Nhà đất bán – Floating
 * Map Button").
 *
 * Chỉ hiện khi khối bản đồ xem trước đã trôi khỏi tầm nhìn VÀ người xem đã cuộn đủ sâu — ở đầu
 * trang, lúc bản đồ còn thấy được, nút nằm im để không che nội dung.
 *
 * Bấm vào: màn hình rộng thì cuộn mượt trở lại khối bản đồ; điện thoại thì mở thẳng chế độ bản
 * đồ toàn màn hình, vì khối xem trước trên điện thoại quá nhỏ để thao tác.
 *
 * KHÔNG dùng emoji trong nhãn theo quy ước giao diện của dự án — dùng biểu tượng bản đồ.
 */

/** Dưới ngưỡng này coi như vẫn ở đầu trang, chưa cần nút. */
const MIN_SCROLL_PX = 400;

interface FloatingMapButtonProps {
  /** Khối bản đồ xem trước trên trang. */
  targetRef: React.RefObject<HTMLElement | null>;
  /** Mở chế độ bản đồ toàn màn hình (dùng trên điện thoại). */
  onOpenFullMap: () => void;
}

export function FloatingMapButton({ targetRef, onOpenFullMap }: FloatingMapButtonProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    /**
     * Tự đo vị trí khối bản đồ mỗi lần cuộn thay vì dùng IntersectionObserver: observer không
     * chạy khi tab bị ẩn hoặc chưa vẽ khung hình nào, lúc đó nút sẽ không bao giờ hiện.
     */
    const update = () => {
      const rect = targetRef.current?.getBoundingClientRect();
      // Không có khối bản đồ (vd. danh sách rỗng) thì chỉ dựa vào độ cuộn.
      const mapOnScreen = rect ? rect.bottom > 0 && rect.top < window.innerHeight : false;
      setVisible(window.scrollY > MIN_SCROLL_PX && !mapOnScreen);
    };

    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [targetRef]);

  const handleClick = () => {
    if (window.innerWidth >= BREAKPOINTS.md && targetRef.current) {
      targetRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    onOpenFullMap();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      className={`fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-primary px-5 py-3 text-[14px] font-bold text-white shadow-[0_6px_20px_rgba(0,0,0,0.25)] transition-all duration-200 hover:bg-primary-dark ${
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'
      }`}
    >
      <MapIcon className="h-4 w-4" />
      Xem bản đồ
    </button>
  );
}
