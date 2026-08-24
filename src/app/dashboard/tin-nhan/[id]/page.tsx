'use client';

import { useState, useRef, useEffect, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Phone, Star, Send, Check, CheckCheck, AlertCircle, MessageSquare } from 'lucide-react';
import api from '@/lib/axios';
import { formatPrice } from '@/lib/formatters';

interface Participant {
  id: number;
  name: string;
  avatar: string | null;
  phone: string | null;
  role: string;
  rating: string | number | null;
  total_listings: number;
}

interface PropertyContext {
  id: number;
  slug: string;
  title: string;
  type: string;
  price: string | number;
  price_unit: string;
  thumbnail: string | null;
  address: string;
}

interface Message {
  id: number;
  sender_id: number;
  type: string;
  content: string;
  attachment_url: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string | null;
}

interface ConversationResponse {
  conversation: { id: number; uuid: string; participant: Participant | null; property: PropertyContext | null };
  current_user_id: number;
  data: Message[];
}

function formatDayLabel(date: Date): string {
  const today = new Date();
  const isToday =
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
  const label = date.toLocaleDateString('vi-VN');
  return isToday ? `Hôm nay, ${label}` : label;
}

export default function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery<ConversationResponse>({
    queryKey: ['conversation-messages', id],
    queryFn: () => api.get(`/api/v2/my/conversations/${id}/messages`).then((res) => res.data.data),
    retry: false,
  });

  const sendMessage = useMutation({
    mutationFn: (content: string) => api.post(`/api/v2/my/conversations/${id}/messages`, { content }),
    onSuccess: () => {
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['conversation-messages', id] });
      queryClient.invalidateQueries({ queryKey: ['my-conversations'] });
    },
  });

  const messages = data?.data ?? [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSubmit = () => {
    const content = newMessage.trim();
    if (!content || sendMessage.isPending) return;
    sendMessage.mutate(content);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-100px)] flex items-center justify-center bg-white rounded-2xl shadow-sm border border-gray-100">
        <p className="text-gray-500 font-medium">Đang tải cuộc trò chuyện...</p>
      </div>
    );
  }

  if (isError || !data) {
    // 403 = không phải người tham gia hội thoại; 404 = hội thoại không tồn tại.
    const status = (error as { response?: { status?: number } } | null)?.response?.status;
    const message =
      status === 403
        ? 'Bạn không có quyền xem cuộc trò chuyện này.'
        : status === 404
          ? 'Không tìm thấy cuộc trò chuyện.'
          : 'Đã xảy ra lỗi khi tải cuộc trò chuyện. Vui lòng tải lại trang.';

    return (
      <div className="h-[calc(100vh-100px)] flex flex-col items-center justify-center bg-white rounded-2xl shadow-sm border border-gray-100 text-center p-8">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="h-8 w-8 text-[#e03131]" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-1">Không mở được cuộc trò chuyện</h2>
        <p className="text-gray-500 text-sm mb-6 max-w-sm">{message}</p>
        <Link href="/dashboard/tin-nhan">
          <Button variant="outline" className="bg-white font-semibold">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Về danh sách tin nhắn
          </Button>
        </Link>
      </div>
    );
  }

  const { conversation, current_user_id: currentUserId } = data;
  const participant = conversation.participant;
  const property = conversation.property;
  const participantName = participant?.name ?? 'Người dùng đã rời đi';
  const isAgent = participant?.role === 'agent';
  const rating = participant?.rating != null ? Number(participant.rating) : null;

  let lastDayKey = '';

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

          <Avatar className="h-11 w-11 border border-gray-100 shadow-sm">
            <AvatarImage src={participant?.avatar || undefined} />
            <AvatarFallback className="bg-primary-light text-primary font-bold">
              {participantName.charAt(0)}
            </AvatarFallback>
          </Avatar>

          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h2 className="font-bold text-gray-900 text-[16px] leading-none">{participantName}</h2>
              {isAgent && rating !== null && rating > 0 && (
                <Badge className="bg-primary-light text-primary hover:bg-primary-light border-0 h-5 px-1.5 flex items-center gap-1 rounded-sm">
                  <Star className="h-2.5 w-2.5 fill-primary text-primary" />
                  <span className="text-[10px] font-bold">{rating.toFixed(1)}</span>
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-500 font-medium">
              {isAgent ? `${participant?.total_listings ?? 0} tin đăng` : 'Khách hàng cá nhân'}
            </p>
          </div>
        </div>

        {participant?.phone && (
          <Link href={`tel:${participant.phone}`}>
            <Button size="icon" variant="ghost" className="text-primary hover:text-primary hover:bg-primary-light h-10 w-10 rounded-full">
              <Phone className="h-5 w-5" />
            </Button>
          </Link>
        )}
      </div>

      {/* Property Context Card */}
      {property && (
        <Link
          href={`/${property.type === 'sell' ? 'mua-ban' : 'cho-thue'}/${property.slug}`}
          className="block shrink-0"
        >
          <div className="p-3 bg-gray-50/80 border-b border-gray-100 flex items-center justify-between group hover:bg-gray-100 transition-colors">
            <div className="flex gap-3 items-center min-w-0">
              {property.thumbnail && (
                <Image
                  src={property.thumbnail}
                  alt={property.title}
                  width={56}
                  height={56}
                  className="w-14 h-14 rounded-lg object-cover shadow-sm border border-gray-200"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm text-gray-900 line-clamp-1 group-hover:text-primary transition-colors">
                  {property.title}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[13px] font-extrabold text-[#e03131]">
                    {formatPrice(Number(property.price), property.price_unit)}
                  </span>
                  <span className="text-xs text-gray-500 line-clamp-1 border-l border-gray-300 pl-3">
                    {property.address}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Link>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-[#f8fafc]">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 border border-gray-100 shadow-sm">
              <MessageSquare className="h-8 w-8 text-primary" />
            </div>
            <p className="text-gray-500 font-medium">Chưa có tin nhắn nào.</p>
          </div>
        ) : (
          messages.map((message) => {
            const isMe = message.sender_id === currentUserId;
            const createdAt = message.created_at ? new Date(message.created_at) : null;
            const dayKey = createdAt ? createdAt.toDateString() : '';
            const showDaySeparator = Boolean(createdAt) && dayKey !== lastDayKey;
            if (showDaySeparator) lastDayKey = dayKey;

            return (
              <div key={message.id}>
                {showDaySeparator && createdAt && (
                  <div className="flex justify-center my-4">
                    <span className="bg-white border border-gray-200 text-gray-500 text-xs px-3 py-1 rounded-full shadow-sm font-medium">
                      {formatDayLabel(createdAt)}
                    </span>
                  </div>
                )}

                <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  {!isMe && (
                    <Avatar className="h-8 w-8 mr-3 shrink-0 shadow-sm border border-gray-100">
                      <AvatarFallback className="bg-white text-gray-600 font-bold text-xs">
                        {participantName.charAt(0)}
                      </AvatarFallback>
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
                    <div
                      className={`flex items-center gap-1.5 mt-1.5 px-1 text-[11px] font-medium text-gray-400 ${
                        isMe ? 'flex-row-reverse' : 'flex-row'
                      }`}
                    >
                      {createdAt && (
                        <span>{createdAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                      )}
                      {isMe &&
                        (message.is_read ? (
                          <CheckCheck className="h-3 w-3 text-primary" />
                        ) : (
                          <Check className="h-3 w-3 text-gray-400" />
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} className="h-1" />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-100 shrink-0">
        {sendMessage.isError && (
          <p className="text-[13px] text-[#e03131] font-medium mb-2 px-2">
            Không gửi được tin nhắn. Vui lòng thử lại.
          </p>
        )}
        <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-full p-1.5 pr-2 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
          <div className="flex-1 shrink min-w-0 pl-3">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập tin nhắn..."
              className="border-0 bg-transparent shadow-none focus-visible:ring-0 h-10 text-[15px] px-0 w-full"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!newMessage.trim() || sendMessage.isPending}
            size="icon"
            className={`h-10 w-10 shrink-0 rounded-full transition-colors shadow-sm ${
              newMessage.trim() && !sendMessage.isPending
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
