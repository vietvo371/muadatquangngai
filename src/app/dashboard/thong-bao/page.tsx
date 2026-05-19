'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
import { UnderlineTabs } from '@/components/dashboard/underline-tabs';

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
  system: { icon: Bell, color: 'bg-orange-100 text-orange-600' },
  review: { icon: Star, color: 'bg-purple-100 text-purple-600' },
  appointment: { icon: Calendar, color: 'bg-indigo-100 text-indigo-600' },
  report: { icon: AlertCircle, color: 'bg-red-100 text-red-600' },
};

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState(notifications);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState('all');

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

  const displayedNotifs = activeTab === 'unread' ? notifs.filter(n => !n.read_at) : notifs;

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
              {unreadCount > 0 ? (
                <span className="text-[#e03131] font-semibold">{unreadCount} thông báo chưa đọc</span>
              ) : (
                'Tất cả đã đọc'
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 border-t sm:border-0 pt-4 sm:pt-0">
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead} className="gap-2 h-10 bg-white hover:bg-gray-50 border-gray-200">
              <CheckCheck className="h-4 w-4 text-green-600" />
              Đánh dấu đã đọc
            </Button>
          )}
          {notifs.some(n => n.read_at) && (
            <Button variant="outline" onClick={deleteAllRead} className="gap-2 h-10 bg-white hover:bg-gray-50 border-gray-200">
              <Trash2 className="h-4 w-4 text-red-500" />
              Xóa đã đọc
            </Button>
          )}
        </div>
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
          <NotificationList
            notifications={displayedNotifs}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onToggleSelectAll={toggleSelectAll}
            onMarkAsRead={markAsRead}
            onDelete={deleteNotification}
          />
        </CardContent>
      </Card>
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
      <div className="py-20 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <BellOff className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">Không có thông báo</h3>
        <p className="text-gray-500">Bạn sẽ nhận được thông báo khi có cập nhật mới</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* List Header Actions */}
      <div className="flex items-center gap-3 p-4 bg-gray-50 border-b border-gray-100">
        <Checkbox
          checked={selectedIds.length === notifications.length && notifications.length > 0}
          onCheckedChange={onToggleSelectAll}
          className="ml-2"
        />
        <span className="text-sm font-medium text-gray-600">
          {selectedIds.length > 0 ? `${selectedIds.length} đã chọn` : 'Chọn tất cả'}
        </span>
        {selectedIds.length > 0 && (
          <Button variant="ghost" size="sm" onClick={() => selectedIds.forEach(id => onDelete(id))} className="ml-auto text-red-600 hover:text-red-700 hover:bg-red-50 h-8">
            <Trash2 className="h-4 w-4 mr-2" /> Xóa đã chọn
          </Button>
        )}
      </div>

      {/* List Items */}
      <div className="divide-y divide-gray-100">
        {notifications.map((notification) => {
          const config = typeConfig[notification.type as keyof typeof typeConfig] || typeConfig.system;
          const Icon = config.icon;
          const isUnread = !notification.read_at;

          return (
            <div
              key={notification.id}
              className={`flex items-start gap-4 p-4 sm:p-5 hover:bg-gray-50 transition-colors ${isUnread ? 'bg-primary-light/10' : ''}`}
            >
              {/* Checkbox */}
              <div className="pt-2">
                <Checkbox
                  checked={selectedIds.includes(notification.id)}
                  onCheckedChange={() => onToggleSelect(notification.id)}
                />
              </div>

              {/* Icon */}
              <div className={`p-3 rounded-full shrink-0 ${config.color}`}>
                <Icon className="h-5 w-5" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className={`text-[15px] leading-tight mb-1 ${isUnread ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>
                      {notification.title}
                      {isUnread && <span className="ml-2 inline-block w-2 h-2 rounded-full bg-primary align-middle"></span>}
                    </h4>
                    <p className={`text-sm line-clamp-2 leading-relaxed ${isUnread ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>
                      {notification.content}
                    </p>
                    <p className="text-xs text-gray-400 mt-2 font-medium">
                      {formatDistanceToNow(new Date(notification.created_at))}
                    </p>
                  </div>

                  {/* Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger className="h-8 w-8 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg flex items-center justify-center transition-colors">
                      <MoreVertical className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                       {notification.action_url && (
                        <Link href={notification.action_url} className="w-full cursor-pointer">
                          <DropdownMenuItem className="cursor-pointer">
                            <Eye className="h-4 w-4 mr-2" /> Xem chi tiết
                          </DropdownMenuItem>
                        </Link>
                      )}
                      {isUnread && (
                        <DropdownMenuItem onClick={() => onMarkAsRead(notification.id)} className="cursor-pointer">
                          <Check className="h-4 w-4 mr-2 text-green-600" /> Đánh dấu đã đọc
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => onDelete(notification.id)} className="text-red-600 focus:text-red-600 cursor-pointer">
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
    </div>
  );
}
