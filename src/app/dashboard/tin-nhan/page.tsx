'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, MessageSquare, Inbox, Home, AlertCircle } from 'lucide-react';
import api from '@/lib/axios';
import { formatDistanceToNow } from '@/lib/formatters';

interface Participant {
  id: number;
  name: string;
  avatar: string | null;
  phone: string | null;
  role: string;
  rating: string | number | null;
  total_listings: number;
}

interface Conversation {
  id: number;
  uuid: string;
  unread_count: number;
  last_message: string | null;
  last_message_at: string | null;
  created_at: string | null;
  participant: Participant | null;
  property: { id: number; slug: string; title: string; type: string } | null;
}

interface ConversationsResponse {
  data: Conversation[];
  unread_total: number;
}

export default function MessagesPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading, isError } = useQuery<ConversationsResponse>({
    queryKey: ['my-conversations'],
    queryFn: () => api.get('/api/v2/my/conversations').then((res) => res.data.data),
  });

  const conversations = data?.data ?? [];
  const totalUnread = data?.unread_total ?? 0;

  const keyword = searchQuery.trim().toLowerCase();
  const filteredConversations = keyword
    ? conversations.filter(
        (conv) =>
          (conv.participant?.name ?? '').toLowerCase().includes(keyword) ||
          (conv.last_message ?? '').toLowerCase().includes(keyword)
      )
    : conversations;

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
          {isLoading ? (
            <div className="divide-y divide-gray-50">
              {[0, 1, 2].map((i) => (
                <div key={i} className="p-4 flex gap-4">
                  <div className="h-12 w-12 rounded-full bg-gray-100 animate-pulse shrink-0" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-3.5 w-1/2 bg-gray-100 rounded animate-pulse" />
                    <div className="h-3 w-3/4 bg-gray-100 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="p-12 text-center flex flex-col items-center justify-center h-full">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="h-8 w-8 text-[#e03131]" />
              </div>
              <p className="text-gray-900 font-bold mb-1">Không tải được tin nhắn</p>
              <p className="text-gray-500 text-sm">Đã xảy ra lỗi khi tải danh sách. Vui lòng tải lại trang.</p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center h-full">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <Inbox className="h-8 w-8 text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium">
                {keyword ? 'Không tìm thấy tin nhắn phù hợp' : 'Chưa có tin nhắn nào.'}
              </p>
            </div>
          ) : (
            filteredConversations.map((conversation) => {
              const name = conversation.participant?.name ?? 'Người dùng đã rời đi';
              const isAgent = conversation.participant?.role === 'agent';

              return (
                <Link key={conversation.id} href={`/dashboard/tin-nhan/${conversation.id}`} className="block">
                  <div
                    className={`p-4 border-b border-gray-50 border-l-4 border-l-transparent hover:bg-gray-50 transition-all ${
                      conversation.unread_count > 0 ? 'bg-primary-light/5' : ''
                    }`}
                  >
                    <div className="flex gap-4">
                      <div className="relative shrink-0 pt-1">
                        <Avatar className="h-12 w-12 border border-gray-100">
                          <AvatarImage src={conversation.participant?.avatar || undefined} />
                          <AvatarFallback className="bg-gray-100 text-gray-600 font-medium">
                            {name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-0.5">
                          <p className={`font-bold truncate text-[15px] ${conversation.unread_count > 0 ? 'text-gray-900' : 'text-gray-700'}`}>
                            {name}
                          </p>
                          {conversation.last_message_at && (
                            <span className={`text-[11px] whitespace-nowrap ml-2 ${conversation.unread_count > 0 ? 'text-primary font-bold' : 'text-gray-400 font-medium'}`}>
                              {formatDistanceToNow(conversation.last_message_at)}
                            </span>
                          )}
                        </div>

                        {isAgent && (
                          <Badge className="bg-primary-light text-primary hover:bg-primary-light border-0 mb-1 rounded-[4px] px-1.5 py-0 text-[10px] uppercase font-bold tracking-wider">
                            Môi giới
                          </Badge>
                        )}

                        {conversation.property && (
                          <div className="flex items-center gap-1 mb-1 mt-0.5">
                            <Home className="h-3 w-3 text-gray-400" />
                            <span className="text-[12px] text-gray-500 truncate font-medium">
                              {conversation.property.title}
                            </span>
                          </div>
                        )}

                        <p className={`text-[13px] truncate ${conversation.unread_count > 0 ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>
                          {conversation.last_message ?? 'Chưa có tin nhắn'}
                        </p>
                      </div>

                      {conversation.unread_count > 0 && (
                        <div className="flex-shrink-0 pt-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-[#e03131]"></div>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>

      {/* Empty State - Right Panel */}
      <div className="hidden md:flex flex-1 bg-gray-50 rounded-2xl border border-gray-100 items-center justify-center">
        <div className="text-center p-8 max-w-sm">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-gray-100">
            <MessageSquare className="h-10 w-10 text-primary" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2 tracking-tight">Tin nhắn của bạn</h3>
          <p className="text-gray-500 text-sm leading-relaxed">
            Chọn một cuộc trò chuyện từ danh sách bên trái để xem chi tiết và bắt đầu nhắn tin với đối tác.
          </p>
        </div>
      </div>
    </div>
  );
}
