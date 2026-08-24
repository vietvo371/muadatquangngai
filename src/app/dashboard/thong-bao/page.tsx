'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Trash2,
  Eye,
  MoreVertical,
  Home,
  MessageSquare,
  Star,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import api from '@/lib/axios';
import { formatDistanceToNow } from '@/lib/formatters';
import { UnderlineTabs } from '@/components/ui/underline-tabs';

interface Notification {
  id: number;
  type: string;
  title: string;
  body: string | null;
  data: Record<string, unknown> | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string | null;
}

interface NotificationsResponse {
  data: Notification[];
  unread_count: number;
}

const typeConfig = {
  property: { icon: Home, color: 'bg-[#e8f4fb] text-[#1075b1]' },
  message: { icon: MessageSquare, color: 'bg-[#e8f4fb] text-[#1075b1]' },
  system: { icon: Bell, color: 'bg-[#e8f4fb] text-[#1075b1]' },
  review: { icon: Star, color: 'bg-[#e8f4fb] text-[#1075b1]' },
  appointment: { icon: Calendar, color: 'bg-[#e8f4fb] text-[#1075b1]' },
  report: { icon: AlertCircle, color: 'bg-[#e8f4fb] text-[#1075b1]' },
};

/**
 * Link đi kèm thông báo nằm trong cột JSON `data` — chỉ nhận chuỗi bắt đầu bằng "/" để
 * không biến dữ liệu do hệ thống ghi thành link ra ngoài ngoài ý muốn.
 */
function getActionUrl(notification: Notification): string | null {
  const raw = notification.data?.['action_url'] ?? notification.data?.['url'];
  return typeof raw === 'string' && raw.startsWith('/') ? raw : null;
}

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery<NotificationsResponse>({
    queryKey: ['my-notifications'],
    queryFn: () => api.get('/api/v2/my/notifications').then((res) => res.data.data),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['my-notifications'] });

  const markAsRead = useMutation({
    mutationFn: (id: number) => api.put(`/api/v2/my/notifications/${id}/read`),
    onSuccess: invalidate,
  });

  const markAllAsRead = useMutation({
    mutationFn: () => api.put('/api/v2/my/notifications/read-all'),
    onSuccess: invalidate,
  });

  const removeNotification = useMutation({
    mutationFn: (id: number) => api.delete(`/api/v2/my/notifications/${id}`),
    onSuccess: invalidate,
  });

  const notifications = data?.data ?? [];
  const unreadCount = data?.unread_count ?? 0;
  const displayed = activeTab === 'unread' ? notifications.filter((n) => !n.is_read) : notifications;

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary-light rounded-xl flex items-center justify-center">
            <Bell className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Thông báo</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {isLoading
                ? 'Đang tải...'
                : isError
                  ? 'Không tải được thông báo'
                  : unreadCount > 0
                    ? <span className="text-[#e03131] font-semibold">{unreadCount} thông báo chưa đọc</span>
                    : 'Tất cả đã đọc'}
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <div className="flex items-center gap-2 border-t sm:border-0 pt-4 sm:pt-0">
            <Button
              variant="outline"
              onClick={() => markAllAsRead.mutate()}
              disabled={markAllAsRead.isPending}
              className="gap-2 h-10 bg-white hover:bg-gray-50 border-gray-200"
            >
              <CheckCheck className="h-4 w-4 text-[#1075b1]" />
              Đánh dấu đã đọc
            </Button>
          </div>
        )}
      </div>

      <Card className="rounded-2xl border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 bg-gray-50/50">
          <UnderlineTabs
            tabs={[
              { id: 'all', label: 'Tất cả' },
              { id: 'unread', label: 'Chưa đọc', count: unreadCount > 0 ? unreadCount : undefined },
            ]}
            activeTab={activeTab}
            onChange={setActiveTab}
          />
        </div>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="divide-y divide-gray-100">
              {[0, 1, 2].map((i) => (
                <div key={i} className="p-5 flex gap-4">
                  <div className="h-11 w-11 rounded-full bg-gray-100 animate-pulse shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/3 bg-gray-100 rounded animate-pulse" />
                    <div className="h-3 w-2/3 bg-gray-100 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="py-20 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-[#e03131]" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Không tải được thông báo</h3>
              <p className="text-gray-500">Đã xảy ra lỗi khi tải danh sách thông báo. Vui lòng tải lại trang.</p>
            </div>
          ) : displayed.length === 0 ? (
            <div className="py-20 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BellOff className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {activeTab === 'unread' ? 'Không có thông báo chưa đọc' : 'Chưa có thông báo nào.'}
              </h3>
              <p className="text-gray-500">Bạn sẽ nhận được thông báo khi có cập nhật mới</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {displayed.map((notification) => {
                const config = typeConfig[notification.type as keyof typeof typeConfig] ?? typeConfig.system;
                const Icon = config.icon;
                const isUnread = !notification.is_read;
                const actionUrl = getActionUrl(notification);

                return (
                  <div
                    key={notification.id}
                    className={`flex items-start gap-4 p-4 sm:p-5 hover:bg-gray-50 transition-colors ${isUnread ? 'bg-primary-light/10' : ''}`}
                  >
                    <div className={`p-3 rounded-full shrink-0 ${config.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h4 className={`text-[15px] leading-tight mb-1 ${isUnread ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>
                            {notification.title}
                            {isUnread && <span className="ml-2 inline-block w-2 h-2 rounded-full bg-primary align-middle"></span>}
                          </h4>
                          {notification.body && (
                            <p className={`text-sm line-clamp-2 leading-relaxed ${isUnread ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>
                              {notification.body}
                            </p>
                          )}
                          {notification.created_at && (
                            <p className="text-xs text-gray-400 mt-2 font-medium">
                              {formatDistanceToNow(notification.created_at)}
                            </p>
                          )}
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger className="h-8 w-8 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg flex items-center justify-center transition-colors shrink-0">
                            <MoreVertical className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            {actionUrl && (
                              <Link href={actionUrl} className="w-full cursor-pointer">
                                <DropdownMenuItem className="cursor-pointer">
                                  <Eye className="h-4 w-4 mr-2" /> Xem chi tiết
                                </DropdownMenuItem>
                              </Link>
                            )}
                            {isUnread && (
                              <DropdownMenuItem
                                onClick={() => markAsRead.mutate(notification.id)}
                                className="cursor-pointer"
                              >
                                <Check className="h-4 w-4 mr-2 text-primary" /> Đánh dấu đã đọc
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => removeNotification.mutate(notification.id)}
                              className="text-[#e03131] focus:text-[#e03131] cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Xóa thông báo
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
