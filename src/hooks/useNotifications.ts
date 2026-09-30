import { useCallback, useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useAuthStore } from '@/stores/authStore';
import { playNotificationSound } from '@/lib/notification-sound';

/**
 * Chuông thông báo (Notion 29/09 "Header → Bell Notification", "Real-time Notification",
 * "Multi-tab / Session").
 *
 * Hệ thống chưa có WebSocket/Pusher: trang hỏi server mỗi POLL_INTERVAL_MS khi tab đang mở,
 * hỏi ngay khi quay lại tab. Các tab cùng trình duyệt báo nhau qua BroadcastChannel, nên đọc
 * thông báo ở tab này thì số trên chuông ở tab kia cập nhật luôn.
 *
 * Số chưa đọc luôn lấy từ server (unread_count đếm trong DB), không đếm ở trình duyệt.
 */

export interface AppNotification {
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
  data: AppNotification[];
  unread_count: number;
}

const POLL_INTERVAL_MS = 15 * 1000;
const BELL_LIMIT = 10;
const CHANNEL_NAME = 'mdqn-notifications';
/** id thông báo mới nhất đã "báo" (kêu) — dùng chung mọi tab để một thông báo chỉ kêu một lần. */
const LAST_ALERTED_KEY = 'mdqn:last-alerted-notification-id';

export const NOTIFICATIONS_QUERY_KEY = ['my-notifications'] as const;

function readLastAlertedId(): number {
  try {
    return Number(localStorage.getItem(LAST_ALERTED_KEY)) || 0;
  } catch {
    return 0;
  }
}

function writeLastAlertedId(id: number) {
  try {
    localStorage.setItem(LAST_ALERTED_KEY, String(id));
  } catch {
    // Trình duyệt chặn lưu trữ — chỉ mất chống kêu trùng, không ảnh hưởng thông báo.
  }
}

function openChannel(): BroadcastChannel | null {
  return typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel(CHANNEL_NAME);
}

/** Link đi kèm thông báo — chỉ nhận đường dẫn nội bộ bắt đầu bằng "/". */
export function notificationActionUrl(notification: AppNotification): string | null {
  const raw = notification.data?.['action_url'] ?? notification.data?.['url'];
  return typeof raw === 'string' && raw.startsWith('/') ? raw : null;
}

/** Danh sách + số chưa đọc cho chuông, tự làm mới và kêu khi có thông báo mới. */
export function useBellNotifications() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();
  const initialised = useRef(false);

  const query = useQuery<NotificationsResponse>({
    queryKey: [...NOTIFICATIONS_QUERY_KEY, 'bell'],
    queryFn: () => api.get(`/api/v2/my/notifications?limit=${BELL_LIMIT}`).then((res) => res.data.data),
    enabled: !!accessToken,
    refetchInterval: POLL_INTERVAL_MS,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  // Tab khác đọc / xoá thông báo → làm mới ở tab này.
  useEffect(() => {
    const channel = openChannel();
    if (!channel) return;
    channel.onmessage = () => queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    return () => channel.close();
  }, [queryClient]);

  // Thông báo chưa đọc có id lớn hơn lần báo trước → kêu. Lần tải đầu chỉ ghi mốc, không kêu,
  // để mở trang / F5 không phát âm thanh cho thông báo cũ.
  const newestUnreadId = query.data?.data.find((n) => !n.is_read)?.id ?? 0;
  useEffect(() => {
    if (!query.data) return;
    const lastAlerted = readLastAlertedId();
    if (!initialised.current) {
      initialised.current = true;
      if (newestUnreadId > lastAlerted) writeLastAlertedId(newestUnreadId);
      return;
    }
    if (newestUnreadId > lastAlerted) {
      writeLastAlertedId(newestUnreadId);
      // Chỉ tab đang hiển thị kêu, tránh nhiều tab kêu cùng lúc.
      if (document.visibilityState === 'visible') playNotificationSound();
    }
  }, [query.data, newestUnreadId]);

  return {
    notifications: query.data?.data ?? [],
    unreadCount: query.data?.unread_count ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

/** Đánh dấu đọc / xoá — dùng chung cho chuông và trang Thông báo, báo các tab khác. */
export function useNotificationActions() {
  const queryClient = useQueryClient();

  const refreshEverywhere = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    const channel = openChannel();
    channel?.postMessage('changed');
    channel?.close();
  }, [queryClient]);

  const markAsRead = useMutation({
    mutationFn: (id: number) => api.put(`/api/v2/my/notifications/${id}/read`),
    onSuccess: refreshEverywhere,
  });
  const markAllAsRead = useMutation({
    mutationFn: () => api.put('/api/v2/my/notifications/read-all'),
    onSuccess: refreshEverywhere,
  });
  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/api/v2/my/notifications/${id}`),
    onSuccess: refreshEverywhere,
  });

  return { markAsRead, markAllAsRead, remove };
}
