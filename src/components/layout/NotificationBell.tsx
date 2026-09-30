'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bell, BellOff, CheckCheck } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { formatDistanceToNow } from '@/lib/formatters';
import {
  notificationActionUrl,
  useBellNotifications,
  useNotificationActions,
  type AppNotification,
} from '@/hooks/useNotifications';

/**
 * Chuông thông báo ở đầu trang (Notion 29/09 "Header → Bell Notification", "Notification Badge —
 * Đồng bộ số lượng", "Bell Popup — Đánh dấu đã đọc").
 *
 * Số trên chuông lấy từ dữ liệu thật của người đang đăng nhập (trước đây là chấm đỏ luôn sáng,
 * không liên quan dữ liệu). Bấm một thông báo thì đánh dấu đã đọc rồi mở link kèm theo; trạng thái
 * lưu ở Database nên F5 hay đăng nhập lại không hiện lại.
 */
export function NotificationBell({ variant = 'main' }: { variant?: 'main' | 'dashboard' }) {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, isLoading, isError } = useBellNotifications();
  const { markAsRead, markAllAsRead } = useNotificationActions();

  const handleOpenNotification = (notification: AppNotification) => {
    if (!notification.is_read) markAsRead.mutate(notification.id);
    setOpen(false);
  };

  const triggerClass =
    variant === 'dashboard'
      ? 'relative p-2 rounded-full text-gray-500 hover:bg-gray-100 transition-colors'
      : 'relative inline-flex h-9 w-9 items-center justify-center rounded-md text-gray-700 hover:bg-gray-100 transition-colors';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={triggerClass}
        aria-label={unreadCount > 0 ? `Thông báo, ${unreadCount} chưa đọc` : 'Thông báo'}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#e03131] px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </PopoverTrigger>

      <PopoverContent align="end" className="w-[22rem] max-w-[calc(100vw-2rem)] gap-0 p-0">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <p className="text-sm font-bold text-gray-900">Thông báo</p>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => markAllAsRead.mutate()}
              disabled={markAllAsRead.isPending}
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline disabled:opacity-50"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Đánh dấu đã đọc
            </button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-3 p-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-3.5 w-1/2 animate-pulse rounded bg-gray-100" />
                  <div className="h-3 w-3/4 animate-pulse rounded bg-gray-100" />
                </div>
              ))}
            </div>
          ) : isError ? (
            <p className="px-4 py-8 text-center text-sm text-gray-500">
              Không tải được thông báo. Vui lòng thử lại.
            </p>
          ) : notifications.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <BellOff className="mx-auto mb-2 h-7 w-7 text-gray-300" />
              <p className="text-sm text-gray-500">Chưa có thông báo nào</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {notifications.map((notification) => {
                const actionUrl = notificationActionUrl(notification);
                const isUnread = !notification.is_read;
                const content = (
                  <div className={`px-4 py-3 text-left transition-colors hover:bg-gray-50 ${isUnread ? 'bg-primary-light/20' : ''}`}>
                    <p className={`text-[13px] leading-snug ${isUnread ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>
                      {notification.title}
                    </p>
                    {notification.body && (
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-gray-500">{notification.body}</p>
                    )}
                    {notification.created_at && (
                      <p className="mt-1.5 text-[11px] font-medium text-gray-400">
                        {formatDistanceToNow(notification.created_at)}
                      </p>
                    )}
                  </div>
                );

                return (
                  <li key={notification.id}>
                    {actionUrl ? (
                      <Link href={actionUrl} onClick={() => handleOpenNotification(notification)} className="block">
                        {content}
                      </Link>
                    ) : (
                      <button type="button" onClick={() => handleOpenNotification(notification)} className="block w-full">
                        {content}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="border-t border-gray-100 px-4 py-2.5">
          <Link
            href="/dashboard/thong-bao"
            onClick={() => setOpen(false)}
            className="block text-center text-xs font-semibold text-primary hover:underline"
          >
            Xem tất cả thông báo
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
