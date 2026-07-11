import { useState, useEffect, useCallback } from 'react';
import axios from '@/lib/axios';

interface Notification {
  id: number;
  type: string;
  title: string;
  content: string;
  data?: Record<string, any>;
  action_url?: string;
  read_at?: string;
  created_at: string;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  fetchNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: number) => Promise<void>;
  addNotification: (notification: Notification) => void;
}

export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.read_at).length;

  // Fetch all notifications
  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.get('/api/v2/notifications');
      
      if (response.data.success) {
        setNotifications(response.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch unread count only
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await axios.get('/api/v2/notifications/count');
      return response.data.data?.unread_count || 0;
    } catch (err) {
      return 0;
    }
  }, []);

  // Mark single notification as read
  const markAsRead = useCallback(async (id: number) => {
    try {
      await axios.put(`/api/v2/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
      );
    } catch (err: any) {
      console.error('Failed to mark as read:', err);
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      await axios.put('/api/v2/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
    } catch (err: any) {
      console.error('Failed to mark all as read:', err);
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (id: number) => {
    try {
      await axios.delete(`/api/v2/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err: any) {
      console.error('Failed to delete notification:', err);
    }
  }, []);

  // Add notification (for real-time updates)
  const addNotification = useCallback((notification: Notification) => {
    setNotifications(prev => [notification, ...prev]);
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    addNotification,
  };
}
