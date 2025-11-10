'use client';

import { useEffect, useState } from 'react';
import { sb } from '@/lib/supabase/browser';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  relatedId?: string;
  relatedType?: string;
  createdAt: string;
  userId: number;
}

export function useRealtimeNotifications(userId: number | null) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) return;

    const supabase = sb();

    // Initial fetch
    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from('Notification')
        .select('*')
        .eq('userId', userId)
        .order('createdAt', { ascending: false })
        .limit(10);

      if (!error && data) {
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.read).length);
      }
    };

    fetchNotifications();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'Notification',
          filter: `userId=eq.${userId}`,
        },
        (payload) => {
          console.log('Notification change:', payload);

          if (payload.eventType === 'INSERT') {
            // Add new notification
            setNotifications(prev => [payload.new as Notification, ...prev].slice(0, 10));
            setUnreadCount(prev => prev + 1);
          } else if (payload.eventType === 'UPDATE') {
            // Update existing notification
            setNotifications(prev =>
              prev.map(n => n.id === payload.new.id ? payload.new as Notification : n)
            );
            if ((payload.old as any).read === false && (payload.new as any).read === true) {
              setUnreadCount(prev => Math.max(0, prev - 1));
            }
          } else if (payload.eventType === 'DELETE') {
            // Remove deleted notification
            setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
            if ((payload.old as any).read === false) {
              setUnreadCount(prev => Math.max(0, prev - 1));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return { notifications, unreadCount, setNotifications, setUnreadCount };
}
