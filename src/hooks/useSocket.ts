import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';

// Event types
interface NewMessageEvent {
  type: 'new_message';
  conversation_id: number;
  message: {
    id: number;
    content: string;
    sender_id: number;
    created_at: string;
  };
  sender: {
    id: number;
    name: string;
    avatar?: string;
  };
}

interface PropertyStatusEvent {
  type: 'property_status_changed';
  property_id: number;
  old_status: string;
  new_status: string;
}

interface NotificationEvent {
  type: 'notification';
  notification: {
    id: number;
    type: string;
    title: string;
    content: string;
  };
}

type SocketEvent = NewMessageEvent | PropertyStatusEvent | NotificationEvent;

type EventCallback = (event: SocketEvent) => void;

interface UseSocketReturn {
  isConnected: boolean;
  error: string | null;
  subscribe: (event: string, callback: EventCallback) => void;
  unsubscribe: (event: string) => void;
  sendTyping: (conversationId: number) => void;
}

// For now, this is a placeholder implementation
// In production, integrate with Laravel Echo and Pusher/Soketi
export function useSocket(): UseSocketReturn {
  const { accessToken: token, isAuthenticated } = useAuthStore();
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const callbacksRef = useRef(new Map<string, Set<EventCallback>>());

  // Connect to WebSocket
  useEffect(() => {
    if (!isAuthenticated || !token) {
      setIsConnected(false);
      return;
    }

    // TODO: Initialize Pusher/Echo connection
    // const echo = new Echo({
    //   broadcaster: 'pusher',
    //   key: process.env.NEXT_PUBLIC_PUSHER_KEY,
    //   cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
    //   authEndpoint: '/api/v2/broadcasting/auth',
    //   auth: {
    //     headers: {
    //       Authorization: `Bearer ${token}`,
    //     },
    //   },
    // });

    // Set up event listeners
    // echo.connector.pusher.connection.bind('connected', () => {
    //   setIsConnected(true);
    //   setError(null);
    // });

    // echo.connector.pusher.connection.bind('disconnected', () => {
    //   setIsConnected(false);
    // });

    // echo.connector.pusher.connection.bind('error', (err: any) => {
    //   setError(err.message);
    // });

    // Subscribe to private channel
    // const channel = echo.private(`user.${userId}`);

    // channel.listen('NewMessage', (data: NewMessageEvent) => {
    //   callbacksRef.current.get('new_message')?.forEach(cb => cb(data));
    // });

    // channel.listen('Notification', (data: NotificationEvent) => {
    //   callbacksRef.current.get('notification')?.forEach(cb => cb(data));
    // });

    setIsConnected(true); // Mock connected for now

    return () => {
      // echo.disconnect();
      setIsConnected(false);
    };
  }, [isAuthenticated, token]);

  // Subscribe to event
  const subscribe = useCallback((event: string, callback: EventCallback) => {
    if (!callbacksRef.current.has(event)) {
      callbacksRef.current.set(event, new Set());
    }
    callbacksRef.current.get(event)?.add(callback);

    // TODO: Subscribe to Pusher channel for this event
    // echo.private(`user.${userId}`).listen(event, callback);
  }, []);

  // Unsubscribe from event
  const unsubscribe = useCallback((event: string) => {
    callbacksRef.current.delete(event);
    
    // TODO: Unsubscribe from Pusher channel
    // echo.private(`user.${userId}`).stopListening(event);
  }, []);

  // Send typing indicator
  const sendTyping = useCallback((conversationId: number) => {
    // TODO: Broadcast typing event via Pusher
    // axios.post(`/api/v2/conversations/${conversationId}/typing`);
  }, []);

  return {
    isConnected,
    error,
    subscribe,
    unsubscribe,
    sendTyping,
  };
}

// Hook for chat/messages real-time
export function useChatSocket(conversationId?: number) {
  const { subscribe, unsubscribe, isConnected } = useSocket();
  const [messages, setMessages] = useState<any[]>([]);
  const [typingUsers, setTypingUsers] = useState<number[]>([]);

  useEffect(() => {
    if (!conversationId) return;

    const handleNewMessage = (event: NewMessageEvent) => {
      if (event.conversation_id === conversationId) {
        setMessages(prev => [...prev, event.message]);
      }
    };

    subscribe('new_message', handleNewMessage as EventCallback);

    return () => {
      unsubscribe('new_message');
    };
  }, [conversationId, subscribe, unsubscribe]);

  return {
    messages,
    typingUsers,
    isConnected,
    setMessages,
  };
}
