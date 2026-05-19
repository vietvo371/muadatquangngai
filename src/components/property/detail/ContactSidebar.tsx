'use client';

import { useState } from 'react';
import { Phone, MessageSquare, ShieldCheck } from 'lucide-react';
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
  };
}

export function ContactSidebar({ user }: ContactSidebarProps) {
  const [phoneRevealed, setPhoneRevealed] = useState(false);
  
  const displayPhone = phoneRevealed 
    ? (user.phone || '0901 234 567') 
    : (user.phone ? user.phone.slice(0, 4) + ' *** ***' : '09xx xxx xxx');

  return (
    <div className="sticky top-24 w-full">
      {/* Agent Card */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 mb-4 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative">
            <Avatar className="h-12 w-12 border border-gray-100">
              <AvatarImage src={user.avatar || undefined} />
              <AvatarFallback className="bg-primary-light text-primary font-bold">
                {user.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            {user.is_verified && (
              <div className="absolute bottom-0 right-0 bg-white rounded-full">
                <ShieldCheck className="h-4 w-4 text-green-500" />
              </div>
            )}
          </div>
          <div>
            <div className="text-[15px] font-bold text-gray-900 leading-tight mb-0.5">{user.name}</div>
            <div className="text-[13px] text-gray-500">{user.role || 'Môi giới chuyên nghiệp'}</div>
          </div>
        </div>
        
        {/* Phone reveal button */}
        <Button 
          className="w-full mb-2 bg-primary hover:bg-primary-dark text-white font-bold h-11"
          onClick={() => setPhoneRevealed(true)}
        >
          <Phone className="w-4 h-4 mr-2" /> 
          {displayPhone}
        </Button>
        <Button variant="outline" className="w-full border-gray-200 text-gray-700 hover:bg-gray-50 font-bold h-11">
          <MessageSquare className="w-4 h-4 mr-2" /> 
          Nhắn tin
        </Button>
      </div>

      {/* Quick contact form */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h3 className="text-[15px] font-bold text-gray-900 mb-3">Yêu cầu tư vấn</h3>
        <Input 
          placeholder="Họ tên" 
          className="mb-2 h-11 text-[14px]" 
        />
        <Input 
          placeholder="Số điện thoại" 
          type="tel"
          className="mb-2 h-11 text-[14px]" 
        />
        <Textarea 
          placeholder="Tôi muốn hỏi về..." 
          rows={3} 
          className="mb-3 text-[14px] resize-none" 
        />
        <Button className="w-full bg-cta hover:bg-cta-dark text-white font-bold h-11">
          Gửi yêu cầu
        </Button>
      </div>
    </div>
  );
}
