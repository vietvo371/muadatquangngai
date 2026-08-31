'use client';

import { Phone, MessageSquare } from 'lucide-react';

interface MobileStickyCtaProps {
  phone?: string;
  /** id của khối liên hệ để cuộn tới (form gửi liên hệ nằm trong ContactSidebar). */
  contactTargetId: string;
}

/** Thanh CTA cố định đáy màn hình — chỉ hiện ở mobile. */
export function MobileStickyCta({ phone, contactTargetId }: MobileStickyCtaProps) {
  const scrollToContact = () => {
    document.getElementById(contactTargetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 px-4 py-3 flex gap-3 shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
      {phone && (
        <a
          href={`tel:${phone}`}
          className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl border-2 border-primary text-primary font-bold text-[15px] transition-colors hover:bg-primary-light"
        >
          <Phone className="w-5 h-5" />
          Gọi điện
        </a>
      )}
      <button
        type="button"
        onClick={scrollToContact}
        className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl bg-cta hover:bg-cta-dark text-white font-bold text-[15px] transition-colors"
      >
        <MessageSquare className="w-5 h-5" />
        Liên hệ ngay
      </button>
    </div>
  );
}
