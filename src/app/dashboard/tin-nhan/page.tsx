'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, MessageSquare, Phone, MoreVertical, Star, Inbox } from 'lucide-react';
import { formatDistanceToNow } from '@/lib/formatters';

// Mock conversations
const conversations = [
  {
    id: 1,
    participant: {
      id: 101,
      name: 'Nguyễn Văn A',
      avatar: null,
      is_agent: true,
      rating: 4.8,
    },
    last_message: {
      content: 'Căn hộ này vẫn còn không ạ?',
      created_at: '2024-01-20T10:30:00Z',
      is_mine: false,
    },
    unread_count: 2,
    property: {
      id: 1,
      title: 'Căn hộ cao cấp 2PN view biển Mỹ Khê',
      slug: 'can-ho-cao-cap-2pn-view-bien',
      thumbnail: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=100&h=100&fit=crop',
    },
  },
  {
    id: 2,
    participant: {
      id: 102,
      name: 'Trần Thị B',
      avatar: null,
      is_agent: false,
    },
    last_message: {
      content: 'Cảm ơn bạn đã quan tâm! Mình sẽ liên hệ lại sau.',
      created_at: '2024-01-19T15:45:00Z',
      is_mine: false,
    },
    unread_count: 0,
    property: null,
  },
  {
    id: 3,
    participant: {
      id: 103,
      name: 'Lê Văn C',
      avatar: null,
      is_agent: true,
      rating: 4.5,
    },
    last_message: {
      content: 'Bạn có thể đến xem vào ngày mai được không?',
      created_at: '2024-01-18T09:20:00Z',
      is_mine: true,
    },
    unread_count: 0,
    property: {
      id: 2,
      title: 'Nhà phố 3 tầng mặt tiền',
      slug: 'nha-pho-3-tang-mat-tien',
      thumbnail: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=100&h=100&fit=crop',
    },
  },
  {
    id: 4,
    participant: {
      id: 104,
      name: 'Phạm Thị D',
      avatar: null,
      is_agent: false,
    },
    last_message: {
      content: 'Giá này có thể thương lượng được không?',
      created_at: '2024-01-17T14:10:00Z',
      is_mine: false,
    },
    unread_count: 0,
    property: null,
  },
];

export default function MessagesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);

  const filteredConversations = conversations.filter(conv =>
    conv.participant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.last_message.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalUnread = conversations.reduce((sum, c) => sum + c.unread_count, 0);

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col md:flex-row gap-6 animate-in fade-in duration-500 max-w-6xl mx-auto">
      {/* Conversations List */}
      <div className="w-full md:w-[380px] flex-shrink-0 flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Tin nhắn
            </h1>
            {totalUnread > 0 && (
              <Badge className="bg-[#e03131] hover:bg-[#e03131] text-white border-0 px-2 py-0.5 rounded-full font-bold">
                {totalUnread} mới
              </Badge>
            )}
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Tìm kiếm người nhắn..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white border-gray-200 h-10 rounded-xl"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.map((conversation) => (
            <Link
              key={conversation.id}
              href={`/dashboard/tin-nhan/${conversation.id}`}
              className="block"
            >
              <div
                className={`p-4 border-b border-gray-50 transition-all ${
                  selectedConversation === conversation.id ? 'bg-primary-light/10 border-l-4 border-l-primary' : 'border-l-4 border-l-transparent hover:bg-gray-50'
                } ${conversation.unread_count > 0 ? 'bg-primary-light/5' : ''}`}
                onClick={() => setSelectedConversation(conversation.id)}
              >
                <div className="flex gap-4">
                  {/* Avatar */}
                  <div className="relative shrink-0 pt-1">
                    <Avatar className="h-12 w-12 border border-gray-100">
                      <AvatarImage src={conversation.participant.avatar || undefined} />
                      <AvatarFallback className="bg-gray-100 text-gray-600 font-medium">
                        {conversation.participant.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    {conversation.participant.is_agent && (
                      <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-white rounded-full p-0.5 border-2 border-white shadow-sm">
                        <Star className="h-2.5 w-2.5 fill-current" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-0.5">
                      <p className={`font-bold truncate text-[15px] ${
                        conversation.unread_count > 0 ? 'text-gray-900' : 'text-gray-700'
                      }`}>
                        {conversation.participant.name}
                      </p>
                      <span className={`text-[11px] whitespace-nowrap ml-2 ${conversation.unread_count > 0 ? 'text-primary font-bold' : 'text-gray-400 font-medium'}`}>
                        {formatDistanceToNow(new Date(conversation.last_message.created_at))}
                      </span>
                    </div>

                    {conversation.participant.is_agent && (
                      <Badge className="bg-yellow-50 text-yellow-700 hover:bg-yellow-50 border-0 mb-1 rounded-[4px] px-1.5 py-0 text-[10px] uppercase font-bold tracking-wider">Môi giới</Badge>
                    )}

                    {/* Property indicator */}
                    {conversation.property && (
                      <div className="flex items-center gap-1 mb-1 mt-0.5">
                        <Home className="h-3 w-3 text-gray-400" />
                        <span className="text-[12px] text-gray-500 truncate font-medium">
                          {conversation.property.title}
                        </span>
                      </div>
                    )}

                    {/* Last message */}
                    <p className={`text-[13px] truncate ${
                      conversation.unread_count > 0 ? 'text-gray-900 font-semibold' : 'text-gray-500'
                    }`}>
                      {conversation.last_message.is_mine && <span className="text-gray-400 mr-1">Bạn:</span>}
                      {conversation.last_message.content}
                    </p>
                  </div>

                  {/* Unread dot */}
                  {conversation.unread_count > 0 && (
                    <div className="flex-shrink-0 pt-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#e03131]"></div>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}

          {filteredConversations.length === 0 && (
            <div className="p-12 text-center flex flex-col items-center justify-center h-full">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <Inbox className="h-8 w-8 text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium">Không tìm thấy tin nhắn nào</p>
            </div>
          )}
        </div>
      </div>

      {/* Empty State - Right Panel */}
      <div className="hidden md:flex flex-1 bg-gray-50 rounded-2xl border border-gray-100 items-center justify-center">
        <div className="text-center p-8 max-w-sm">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-gray-100">
            <MessageSquare className="h-10 w-10 text-primary" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2 tracking-tight">
            Tin nhắn của bạn
          </h3>
          <p className="text-gray-500 text-sm leading-relaxed">
            Chọn một cuộc trò chuyện từ danh sách bên trái để xem chi tiết và bắt đầu nhắn tin với đối tác.
          </p>
        </div>
      </div>
    </div>
  );
}
