'use client';

import { useState } from 'react';
import { Phone, MessageSquare, ShieldCheck, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ContactSidebarProps {
  user: {
    name: string;
    avatar?: string | null;
    phone?: string;
    is_verified?: boolean;
    role?: string;
    joinDate?: string;
  };
}

export function ContactSidebar({ user }: ContactSidebarProps) {
  const [phoneRevealed, setPhoneRevealed] = useState(false);

  const rawPhone = user.phone || '0901234567';
  const displayPhone = phoneRevealed
    ? rawPhone.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3')
    : rawPhone.slice(0, 4) + ' *** ***';

  const zaloLink = `https://zalo.me/${rawPhone}`;

  return (
    <div className="sticky top-24 w-full space-y-4">
      {/* Agent Card */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative">
            <Avatar className="h-14 w-14 border border-gray-100">
              <AvatarImage src={user.avatar || undefined} />
              <AvatarFallback className="bg-primary-light text-primary font-bold text-[18px]">
                {user.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            {user.is_verified && (
              <div className="absolute -bottom-0.5 -right-0.5 bg-white rounded-full p-0.5 shadow-sm">
                <ShieldCheck className="h-4 w-4 text-primary" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[15px] font-bold text-gray-900 leading-tight mb-0.5 truncate">{user.name}</div>
            <div className="text-[13px] text-gray-500">{user.role || 'Môi giới chuyên nghiệp'}</div>
            {user.joinDate && (
              <div className="text-[12px] text-gray-400 mt-0.5">Thành viên từ {user.joinDate}</div>
            )}
          </div>
        </div>

        {/* Phone reveal */}
        <Button
          className="w-full mb-2 bg-primary hover:bg-primary-dark text-white font-bold h-11 text-[15px] tracking-wide"
          onClick={() => setPhoneRevealed(true)}
        >
          <Phone className="w-4 h-4 mr-2" />
          {displayPhone}
        </Button>

        <div className="grid grid-cols-2 gap-2">
          <a
            href={zaloLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 h-11 rounded-lg border border-[#0068FF] text-[#0068FF] text-[13px] font-bold hover:bg-[#0068FF]/5 transition-colors"
          >
            <svg viewBox="0 0 48 48" className="w-5 h-5" fill="currentColor">
              <path d="M24 4C13 4 4 12.1 4 22.2c0 5.8 3 11 7.8 14.4L10 42l6.2-3.2A21 21 0 0024 40.4c11 0 20-8.1 20-18.2S35 4 24 4z" />
              <path d="M14.5 25.5l3.2-4.7h1.5l-2.4 3.6 2.6 4h-1.6l-1.9-2.9-.9 1v1.9H14V20.8h1.5v4.7zm5.8-4.7h1.5v8H20.3zm2.8 0H27a3 3 0 013 3v2a3 3 0 01-3 3h-4v-8zm1.5 1.5v5H27a1.5 1.5 0 001.5-1.5v-2A1.5 1.5 0 0027 22.3h-2.4zm5.2-1.5h4.5v1.5H31v1.7h3v1.5h-3v1.8h3.3v1.5H30V20.8z" fill="white" />
            </svg>
            Zalo
          </a>
          <Button variant="outline" className="border-gray-200 text-gray-700 hover:bg-gray-50 font-bold h-11">
            <MessageSquare className="w-4 h-4 mr-1.5" />
            Nhắn tin
          </Button>
        </div>
      </div>

      {/* Quick contact form */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h3 className="text-[15px] font-bold text-gray-900 mb-3">Yêu cầu tư vấn</h3>
        <Input placeholder="Họ tên" className="mb-2 h-11 text-[14px]" />
        <Input placeholder="Số điện thoại" type="tel" className="mb-2 h-11 text-[14px]" />
        <Textarea
          placeholder="Tôi muốn hỏi về bất động sản này..."
          rows={3}
          className="mb-3 text-[14px] resize-none"
        />
        <Button className="w-full bg-cta hover:bg-cta-dark text-white font-bold h-11">
          Gửi yêu cầu
        </Button>
      </div>

      {/* Report */}
      <button className="w-full flex items-center justify-center gap-1.5 text-[12px] text-gray-400 hover:text-gray-600 transition-colors py-1">
        <Flag className="w-3.5 h-3.5" />
        Báo cáo tin đăng vi phạm
      </button>
    </div>
  );
}
