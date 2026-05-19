'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ArrowLeft,
  MoreVertical,
  Phone,
  Home,
  Star,
  Send,
  Image,
  Smile,
  Check,
  CheckCheck,
  Info
} from 'lucide-react';
import { formatDistanceToNow, formatPrice } from '@/lib/formatters';

// Mock data
const conversation = {
  id: 1,
  participant: {
    id: 101,
    name: 'Nguyễn Văn A',
    avatar: null,
    phone: '0901234567',
    is_agent: true,
    rating: 4.8,
    total_listings: 45,
    joined_at: '2022-01-01',
  },
  property: {
    id: 1,
    title: 'Căn hộ cao cấp 2PN view biển Mỹ Khê',
    slug: 'can-ho-cao-cap-2pn-view-bien',
    price: 3500000000,
    thumbnail: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=200&h=200&fit=crop',
    address: 'Đường Võ Nguyên Giáp, Sơn Trà, Đà Nẵng',
  },
};

const messages = [
  {
    id: 1,
    content: 'Chào anh/chị, tôi thấy tin đăng trên website và rất quan tâm. Căn hộ này còn không ạ?',
    sender_id: 1, // me
    created_at: '2024-01-20T09:00:00Z',
    status: 'read',
  },
  {
    id: 2,
    content: 'Chào bạn! Căn hộ này vẫn còn nhé. Bạn quan tâm thì có thể đến xem trực tiếp.',
    sender_id: 101, // other
    created_at: '2024-01-20T09:15:00Z',
    status: 'read',
  },
  {
    id: 3,
    content: 'Cảm ơn anh! Cho tôi hỏi giá là bao gồm nội thất chưa ạ?',
    sender_id: 1,
    created_at: '2024-01-20T09:30:00Z',
    status: 'read',
  },
  {
    id: 4,
    content: 'Giá niêm yết là căn hộ không nội thất. Nếu bạn muốn có nội thất thì thương lượng thêm nhé.',
    sender_id: 101,
    created_at: '2024-01-20T09:45:00Z',
    status: 'read',
  },
  {
    id: 5,
    content: 'Vậy cho tôi hỏi căn hộ này có thể vay ngân hàng được không?',
    sender_id: 1,
    created_at: '2024-01-20T10:00:00Z',
    status: 'read',
  },
  {
    id: 6,
    content: 'Có bạn nhé! Ngân hàng có thể cho vay đến 70% giá trị căn hộ. Mình có thể hỗ trợ thủ tục vay nếu bạn cần.',
    sender_id: 101,
    created_at: '2024-01-20T10:15:00Z',
    status: 'read',
  },
  {
    id: 7,
    content: 'Tuyệt vời! Vậy tôi có thể đến xem vào cuối tuần này được không ạ?',
    sender_id: 1,
    created_at: '2024-01-20T10:30:00Z',
    status: 'delivered',
  },
];

export default function ConversationPage({
  params,
}: {
  params: { id: string };
}) {
  const [newMessage, setNewMessage] = useState('');
  const [msgs, setMsgs] = useState(messages);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs]);

  const sendMessage = () => {
    if (!newMessage.trim()) return;

    const message = {
      id: msgs.length + 1,
      content: newMessage,
      sender_id: 1,
      created_at: new Date().toISOString(),
      status: 'sent' as const,
    };

    setMsgs([...msgs, message]);
    setNewMessage('');

    // Simulate reply after 1.5 seconds
    setTimeout(() => {
      const reply = {
        id: msgs.length + 2,
        content: 'Cảm ơn bạn! Mình sẽ liên hệ lại để xác nhận lịch xem nhé.',
        sender_id: 101,
        created_at: new Date().toISOString(),
        status: 'sent' as const,
      };
      setMsgs(prev => [...prev, reply]);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <Check className="h-3 w-3 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="h-3 w-3 text-gray-400" />;
      case 'read':
        return <CheckCheck className="h-3 w-3 text-primary" />;
      default:
        return null;
    }
  };

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in duration-300">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 bg-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/tin-nhan" className="md:hidden">
            <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>

          <div className="relative">
            <Avatar className="h-11 w-11 border border-gray-100 shadow-sm">
              <AvatarImage src={conversation.participant.avatar || undefined} />
              <AvatarFallback className="bg-primary-light text-primary font-bold">
                {conversation.participant.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h2 className="font-bold text-gray-900 text-[16px] leading-none">{conversation.participant.name}</h2>
              {conversation.participant.is_agent && (
                <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-0 h-5 px-1.5 flex items-center gap-1 rounded-sm">
                  <Star className="h-2.5 w-2.5 fill-yellow-600 text-yellow-600" />
                  <span className="text-[10px] font-bold">{conversation.participant.rating}</span>
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-500 font-medium">
              {conversation.participant.is_agent ? `${conversation.participant.total_listings} tin đăng` : 'Khách hàng cá nhân'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Link href={`tel:${conversation.participant.phone}`}>
            <Button size="icon" variant="ghost" className="text-primary hover:text-primary hover:bg-primary-light h-10 w-10 rounded-full">
              <Phone className="h-5 w-5" />
            </Button>
          </Link>
          <Button size="icon" variant="ghost" className="h-10 w-10 rounded-full text-gray-500">
            <Info className="h-5 w-5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="h-10 w-10 rounded-full text-gray-500">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem className="cursor-pointer font-medium">Xem hồ sơ</DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer font-medium">Chặn người dùng</DropdownMenuItem>
              <DropdownMenuItem className="text-red-600 focus:text-red-600 cursor-pointer font-medium">Xóa cuộc trò chuyện</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Property Context Card */}
      {conversation.property && (
        <Link href={`/mua-ban/${conversation.property.slug}`} className="block shrink-0">
          <div className="p-3 bg-gray-50/80 border-b border-gray-100 flex items-center justify-between group hover:bg-gray-100 transition-colors">
            <div className="flex gap-3 items-center">
              <img
                src={conversation.property.thumbnail}
                alt={conversation.property.title}
                className="w-14 h-14 rounded-lg object-cover shadow-sm border border-gray-200"
              />
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm text-gray-900 line-clamp-1 group-hover:text-primary transition-colors">
                  {conversation.property.title}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[13px] font-extrabold text-[#e03131]">
                    {formatPrice(conversation.property.price)}
                  </span>
                  <span className="text-xs text-gray-500 line-clamp-1 border-l border-gray-300 pl-3">
                    {conversation.property.address}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Link>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-[#f8fafc]">
        {/* Date separator */}
        <div className="flex justify-center my-4">
          <span className="bg-white border border-gray-200 text-gray-500 text-xs px-3 py-1 rounded-full shadow-sm font-medium">
            Hôm nay, {new Date().toLocaleDateString('vi-VN')}
          </span>
        </div>

        {msgs.map((message) => {
          const isMe = message.sender_id === 1;
          return (
            <div
              key={message.id}
              className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
            >
              {!isMe && (
                <Avatar className="h-8 w-8 mr-3 shrink-0 shadow-sm border border-gray-100">
                  <AvatarFallback className="bg-white text-gray-600 font-bold text-xs">{conversation.participant.name.charAt(0)}</AvatarFallback>
                </Avatar>
              )}

              <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[75%]`}>
                <div
                  className={`px-4 py-2.5 rounded-2xl shadow-sm text-[14.5px] leading-relaxed ${
                    isMe
                      ? 'bg-primary text-white rounded-br-sm'
                      : 'bg-white border border-gray-100 text-gray-900 rounded-bl-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{message.content}</p>
                </div>
                <div className={`flex items-center gap-1.5 mt-1.5 px-1 text-[11px] font-medium text-gray-400 ${
                  isMe ? 'flex-row-reverse' : 'flex-row'
                }`}>
                  <span>{new Date(message.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                  {isMe && getStatusIcon(message.status)}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} className="h-1" />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-100 shrink-0">
        <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-full p-1.5 pr-2 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
          <div className="flex shrink-0">
            <Button size="icon" variant="ghost" className="h-9 w-9 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-200 shrink-0">
              <Image className="h-5 w-5" />
            </Button>
            <Button size="icon" variant="ghost" className="h-9 w-9 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-200 shrink-0 hidden sm:flex">
              <Smile className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="flex-1 shrink min-w-0">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Nhập tin nhắn..."
              className="border-0 bg-transparent shadow-none focus-visible:ring-0 h-10 text-[15px] px-0 w-full"
            />
          </div>

          <Button
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            size="icon"
            className={`h-10 w-10 shrink-0 rounded-full transition-colors shadow-sm ${
              newMessage.trim() 
                ? 'bg-primary hover:bg-primary-dark text-white' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Send className="h-4 w-4 ml-0.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
