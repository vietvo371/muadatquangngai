'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
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

    // Simulate reply after 1 second
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
    <div className="h-[calc(100vh-100px)] flex flex-col bg-white rounded-lg border">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/tin-nhan">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>

          <Avatar className="h-10 w-10">
            <AvatarImage src={conversation.participant.avatar || undefined} />
            <AvatarFallback>{conversation.participant.name.charAt(0)}</AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-gray-900">{conversation.participant.name}</h2>
              {conversation.participant.is_agent && (
                <Badge variant="secondary" className="text-xs">
                  <Star className="h-3 w-3 mr-1 fill-yellow-500 text-yellow-500" />
                  {conversation.participant.rating}
                </Badge>
              )}
            </div>
            {conversation.participant.is_agent ? (
              <p className="text-sm text-gray-500">{conversation.participant.total_listings} tin đăng</p>
            ) : (
              <p className="text-sm text-gray-500">Khách hàng</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Link href={`tel:${conversation.participant.phone}`}>
              <Button size="icon" variant="outline">
                <Phone className="h-4 w-4" />
              </Button>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger>
                <Button size="icon" variant="ghost">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Xem hồ sơ</DropdownMenuItem>
                <DropdownMenuItem>Chặn tin nhắn</DropdownMenuItem>
                <DropdownMenuItem className="text-red-600">Xóa cuộc trò chuyện</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Property Card */}
      {conversation.property && (
        <Link href={`/mua-ban/${conversation.property.slug}`}>
          <div className="p-3 border-b hover:bg-gray-50 transition-colors">
            <div className="flex gap-3">
              <img
                src={conversation.property.thumbnail}
                alt={conversation.property.title}
                className="w-16 h-16 rounded-lg object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 line-clamp-1">
                  {conversation.property.title}
                </p>
                <p className="text-sm text-red-600 font-semibold">
                  {formatPrice(conversation.property.price)}
                </p>
                <p className="text-xs text-gray-500 line-clamp-1">
                  {conversation.property.address}
                </p>
              </div>
            </div>
          </div>
        </Link>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {msgs.map((message) => {
          const isMe = message.sender_id === 1;
          return (
            <div
              key={message.id}
              className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
            >
              {!isMe && (
                <Avatar className="h-8 w-8 mr-2 flex-shrink-0">
                  <AvatarFallback>{conversation.participant.name.charAt(0)}</AvatarFallback>
                </Avatar>
              )}

              <div
                className={`max-w-[70%] ${
                  isMe ? 'order-1' : 'order-0'
                }`}
              >
                <div
                  className={`px-4 py-2 rounded-2xl ${
                    isMe
                      ? 'bg-primary text-white rounded-br-md'
                      : 'bg-gray-100 text-gray-900 rounded-bl-md'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
                <div className={`flex items-center gap-1 mt-1 text-xs text-gray-400 ${
                  isMe ? 'justify-end' : 'justify-start'
                }`}>
                  <span>{formatDistanceToNow(new Date(message.created_at))}</span>
                  {isMe && getStatusIcon(message.status)}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex items-end gap-2">
          <Button size="icon" variant="ghost">
            <Image className="h-5 w-5" />
          </Button>
          <Button size="icon" variant="ghost">
            <Smile className="h-5 w-5" />
          </Button>
          
          <div className="flex-1">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Nhập tin nhắn..."
              className="rounded-full"
            />
          </div>

          <Button
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            size="icon"
            className="bg-primary hover:bg-primary-dark"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
