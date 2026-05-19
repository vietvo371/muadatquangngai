'use client';
import { Phone, MessageCircle, Mail, ShieldCheck, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ContactSidebarProps {
  user: {
    name: string;
    avatar?: string | null;
    phone?: string;
    is_verified?: boolean;
    joinDate?: string;
  };
}

export function ContactSidebar({ user }: ContactSidebarProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-xl shadow-gray-100/50 p-6 sticky top-24">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-14 h-14 rounded-full object-cover" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-xl">
              {user.name.charAt(0)}
            </div>
          )}
          <div>
            <h3 className="font-bold text-gray-900 text-[16px] flex items-center gap-1.5 leading-tight">
              {user.name}
              {user.is_verified && <ShieldCheck className="w-4 h-4 text-[#10b981]" />}
            </h3>
            <p className="text-[13px] text-gray-500 mt-1">Tham gia: {user.joinDate || '2023'}</p>
          </div>
        </div>
        <button className="p-2 border border-gray-200 rounded-full text-gray-400 hover:text-[#e03131] hover:bg-red-50 hover:border-red-100 transition-colors" title="Lưu tin này">
          <Heart className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-3 mb-6">
        <Button className="w-full h-12 bg-[#0ea5e9] hover:bg-[#0284c7] text-white font-bold text-[15px] flex items-center justify-center gap-2">
          <MessageCircle className="w-5 h-5" />
          Chat qua Zalo
        </Button>
        <Button className="w-full h-12 bg-[#10b981] hover:bg-[#059669] text-white font-bold text-[15px] flex items-center justify-center gap-2">
          <Phone className="w-5 h-5" />
          {user.phone || '0901 234 567'}
        </Button>
        <Button variant="outline" className="w-full h-12 border-gray-200 text-gray-700 font-semibold text-[14px] flex items-center justify-center gap-2 hover:bg-gray-50">
          <Mail className="w-4 h-4" />
          Gửi email
        </Button>
      </div>

      <div className="border-t border-gray-100 pt-5">
        <h4 className="font-semibold text-[14px] text-gray-900 mb-3">Yêu cầu tư vấn</h4>
        <input type="text" placeholder="Họ và tên" className="w-full h-10 border border-gray-200 rounded-lg px-3 mb-3 text-[13px] focus:ring-[3px] focus:ring-primary/15 focus:border-primary outline-none transition-all placeholder:text-gray-400" />
        <input type="tel" placeholder="Số điện thoại" className="w-full h-10 border border-gray-200 rounded-lg px-3 mb-3 text-[13px] focus:ring-[3px] focus:ring-primary/15 focus:border-primary outline-none transition-all placeholder:text-gray-400" />
        <textarea placeholder="Tôi quan tâm đến bất động sản này..." className="w-full border border-gray-200 rounded-lg p-3 mb-3 text-[13px] min-h-[80px] focus:ring-[3px] focus:ring-primary/15 focus:border-primary outline-none resize-none transition-all placeholder:text-gray-400"></textarea>
        <Button className="w-full h-11 bg-gray-900 hover:bg-black text-white font-semibold text-[14px]">
          Gửi yêu cầu
        </Button>
      </div>
    </div>
  );
}
