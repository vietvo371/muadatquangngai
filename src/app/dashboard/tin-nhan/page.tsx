'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, MessageSquare, Phone, MoreVertical, Star } from 'lucide-react';
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
    <div className="h-[calc(100vh-100px)] flex gap-6">
      {/* Conversations List */}
      <div className="w-80 flex-shrink-0 flex flex-col bg-white rounded-lg border">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900">Tin nhắn</h1>
            {totalUnread > 0 && (
              <Badge variant="destructive">{totalUnread}</Badge>
            )}
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Tìm kiếm tin nhắn..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.map((conversation) => (
            <Link
              key={conversation.id}
              href={`/dashboard/tin-nhan/${conversation.id}`}
            >
              <div
                className={`p-4 border-b hover:bg-gray-50 transition-colors ${
                  selectedConversation === conversation.id ? 'bg-blue-50' : ''
                } ${conversation.unread_count > 0 ? 'bg-blue-50/30' : ''}`}
                onClick={() => setSelectedConversation(conversation.id)}
              >
                <div className="flex gap-3">
                  {/* Avatar */}
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={conversation.participant.avatar || undefined} />
                      <AvatarFallback>
                        {conversation.participant.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    {conversation.participant.is_agent && (
                      <div className="absolute -bottom-1 -right-1 bg-primary text-white rounded-full p-0.5">
                        <Star className="h-3 w-3 fill-current" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`font-medium truncate ${
                        conversation.unread_count > 0 ? 'text-gray-900' : 'text-gray-700'
                      }`}>
                        {conversation.participant.name}
                        {conversation.participant.is_agent && (
                          <Badge variant="secondary" className="ml-2 text-xs">Môi giới</Badge>
                        )}
                      </p>
                      <span className="text-xs text-gray-400">
                        {formatDistanceToNow(new Date(conversation.last_message.created_at))}
                      </span>
                    </div>

                    {/* Property */}
                    {conversation.property && (
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-xs text-gray-500 line-clamp-1">
                          {conversation.property.title}
                        </span>
                      </div>
                    )}

                    {/* Last message */}
                    <p className={`text-sm mt-1 truncate ${
                      conversation.unread_count > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'
                    }`}>
                      {conversation.last_message.is_mine && 'Bạn: '}
                      {conversation.last_message.content}
                    </p>
                  </div>

                  {/* Unread badge */}
                  {conversation.unread_count > 0 && (
                    <div className="flex-shrink-0">
                      <Badge variant="default" className="bg-primary">
                        {conversation.unread_count}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}

          {filteredConversations.length === 0 && (
            <div className="p-8 text-center">
              <MessageSquare className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">Không có cuộc trò chuyện nào</p>
            </div>
          )}
        </div>
      </div>

      {/* Empty State - Right Panel */}
      <div className="flex-1 bg-white rounded-lg border flex items-center justify-center">
        <div className="text-center">
          <MessageSquare className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Chọn một cuộc trò chuyện
          </h3>
          <p className="text-gray-500">
            Chọn cuộc trò chuyện từ danh sách bên trái để bắt đầu nhắn tin
          </p>
        </div>
      </div>
    </div>
  );
}
