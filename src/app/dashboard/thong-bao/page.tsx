'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { formatDistanceToNow } from '@/lib/formatters';

// Mock notifications
const notifications = [
  {
    id: 1,
    type: 'property',
    title: 'Tin đăng đã được duyệt',
    content: 'Tin đăng "Căn hộ cao cấp 2PN view biển" đã được duyệt và đăng tải thành công.',
    action_url: '/dashboard/quan-ly-tin',
    read_at: null,
    created_at: '2024-01-20T10:30:00Z',
  },
  {
    id: 2,
    type: 'message',
    title: 'Tin nhắn mới',
    content: 'Nguyễn Văn A đã gửi tin nhắn cho bạn: "Cho tôi hỏi về căn hộ này..."',
    action_url: '/dashboard/tin-nhan/1',
    read_at: '2024-01-19T15:00:00Z',
    created_at: '2024-01-19T14:45:00Z',
  },
  {
    id: 3,
    type: 'system',
    title: 'Gói VIP sắp hết hạn',
    content: 'Gói VIP của bạn sẽ hết hạn sau 3 ngày. Hãy gia hạn để tiếp tục nổi bật.',
    action_url: '/dashboard/nap-tien',
    read_at: null,
    created_at: '2024-01-18T09:00:00Z',
  },
  {
    id: 4,
    type: 'property',
    title: 'Lịch hẹn xem nhà',
    content: 'Bạn có lịch hẹn xem nhà lúc 14:00 ngày 25/01/2024 tại địa chỉ...',
    action_url: '/dashboard/lich-hen',
    read_at: '2024-01-17T12:00:00Z',
    created_at: '2024-01-17T11:30:00Z',
  },
  {
    id: 5,
    type: 'review',
    title: 'Đánh giá mới',
    content: 'Người dùng đã đánh giá 5 sao cho tin đăng của bạn.',
    action_url: '/dashboard/danh-gia',
    read_at: null,
    created_at: '2024-01-16T16:20:00Z',
  },
];

const typeConfig = {
  property: { icon: Home, color: 'bg-blue-100 text-blue-600' },
  message: { icon: MessageSquare, color: 'bg-green-100 text-green-600' },
  system: { icon: Bell, color: 'bg-yellow-100 text-yellow-600' },
  review: { icon: Star, color: 'bg-purple-100 text-purple-600' },
  appointment: { icon: Calendar, color: 'bg-indigo-100 text-indigo-600' },
  report: { icon: AlertCircle, color: 'bg-red-100 text-red-600' },
};

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState(notifications);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const unreadCount = notifs.filter(n => !n.read_at).length;

  const markAsRead = (id: number) => {
    setNotifs(prev =>
      prev.map(n => (n.id === id ? { ...n, read_at: n.read_at || new Date().toISOString() } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifs(prev =>
      prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
    );
  };

  const deleteNotification = (id: number) => {
    setNotifs(prev => prev.filter(n => n.id !== id));
    setSelectedIds(prev => prev.filter(i => i !== id));
  };

  const deleteAllRead = () => {
    setNotifs(prev => prev.filter(n => !n.read_at));
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === notifs.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(notifs.map(n => n.id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Thông báo</h1>
          <p className="text-gray-500">
            {unreadCount > 0 ? (
              <span className="text-red-500 font-medium">{unreadCount} thông báo chưa đọc</span>
            ) : (
              'Tất cả đã đọc'
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead} className="gap-2">
              <CheckCheck className="h-4 w-4" />
              Đánh dấu đã đọc
            </Button>
          )}
          {notifs.some(n => n.read_at) && (
            <Button variant="outline" onClick={deleteAllRead} className="gap-2">
              <Trash2 className="h-4 w-4" />
              Xóa đã đọc
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">Tất cả</TabsTrigger>
          <TabsTrigger value="unread">
            Chưa đọc
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">{unreadCount}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <NotificationList
            notifications={notifs}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onToggleSelectAll={toggleSelectAll}
            onMarkAsRead={markAsRead}
            onDelete={deleteNotification}
          />
        </TabsContent>

        <TabsContent value="unread" className="mt-4">
          <NotificationList
            notifications={notifs.filter(n => !n.read_at)}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onToggleSelectAll={toggleSelectAll}
            onMarkAsRead={markAsRead}
            onDelete={deleteNotification}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface NotificationListProps {
  notifications: typeof notifications;
  selectedIds: number[];
  onToggleSelect: (id: number) => void;
  onToggleSelectAll: () => void;
  onMarkAsRead: (id: number) => void;
  onDelete: (id: number) => void;
}

function NotificationList({
  notifications,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onMarkAsRead,
  onDelete,
}: NotificationListProps) {
  if (notifications.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <BellOff className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Không có thông báo</h3>
          <p className="text-gray-500">Bạn sẽ nhận được thông báo khi có cập nhật mới</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {/* Header with select all */}
      <div className="flex items-center gap-2 p-2">
        <Checkbox
          checked={selectedIds.length === notifications.length && notifications.length > 0}
          onCheckedChange={onToggleSelectAll}
        />
        <span className="text-sm text-gray-500">
          {selectedIds.length > 0 ? `${selectedIds.length} đã chọn` : 'Chọn tất cả'}
        </span>
        {selectedIds.length > 0 && (
          <Button variant="ghost" size="sm" onClick={() => selectedIds.forEach(id => onDelete(id))}>
            Xóa đã chọn
          </Button>
        )}
      </div>

      {notifications.map((notification) => {
        const config = typeConfig[notification.type as keyof typeof typeConfig] || typeConfig.system;
        const Icon = config.icon;
        const isUnread = !notification.read_at;

        return (
          <Card
            key={notification.id}
            className={`transition-colors ${isUnread ? 'bg-blue-50/50' : ''}`}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                {/* Checkbox */}
                <div className="pt-1">
                  <Checkbox
                    checked={selectedIds.includes(notification.id)}
                    onCheckedChange={() => onToggleSelect(notification.id)}
                  />
                </div>

                {/* Icon */}
                <div className={`p-2 rounded-full ${config.color}`}>
                  <Icon className="h-5 w-5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className={`font-medium ${isUnread ? 'text-gray-900' : 'text-gray-700'}`}>
                        {notification.title}
                        {isUnread && <span className="ml-2 text-blue-500">●</span>}
                      </h4>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {notification.content}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        {formatDistanceToNow(new Date(notification.created_at))}
                      </p>
                    </div>

                    {/* Actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {notification.action_url && (
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            <Link href={notification.action_url}>Xem chi tiết</Link>
                          </DropdownMenuItem>
                        )}
                        {isUnread && (
                          <DropdownMenuItem onClick={() => onMarkAsRead(notification.id)}>
                            <Check className="h-4 w-4 mr-2" />
                            Đánh dấu đã đọc
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => onDelete(notification.id)} className="text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Xóa
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
