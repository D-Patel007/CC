'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useRealtimeNotifications } from '@/lib/hooks/useRealtimeNotifications';

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  read: boolean;
  relatedId?: string;
  relatedType?: string;
  createdAt: string;
  userId: number;
}

export default function NotificationBell() {
  console.log('🔔 NotificationBell component rendered');
  
  const [isOpen, setIsOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Get current user ID
  useEffect(() => {
    console.log('🔍 Fetching user ID from /api/profile');
    let isMounted = true;

    const fetchUserId = async () => {
      try {
        const res = await fetch('/api/profile');
        if (!isMounted) return;

        if (res.ok) {
          const body = await res.json();
          if (!isMounted) return;

          const profile = body?.data;

          if (profile?.id) {
            console.log('✅ Got user ID:', profile.id);
            setCurrentUserId(profile.id);
          } else {
            console.warn('⚠️ Profile payload missing id field:', body);
            setCurrentUserId(null);
          }
        } else {
          console.error('❌ Failed to fetch profile:', res.status);
          setCurrentUserId(null);
        }
      } catch (error) {
        if (isMounted) {
          console.error('❌ Error fetching user ID:', error);
          setCurrentUserId(null);
        }
      }
    };

    fetchUserId();

    return () => {
      isMounted = false;
    };
  }, []);

  // Use real-time notifications hook
  const {
    notifications,
    unreadCount,
    setNotifications,
    setUnreadCount,
    isLoading,
  } = useRealtimeNotifications(currentUserId);

  // Mark notification as read
  const markAsRead = async (notificationId: number) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: [notificationId] }),
      });
      
      // Update local state
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllAsRead: true }),
      });
      
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    setIsOpen(false);

    // Navigate based on notification type
    if (notification.relatedType === 'message' || notification.relatedType === 'conversation') {
      router.push('/messages');
    } else if (notification.relatedType === 'event' && notification.relatedId) {
      router.push(`/events/${notification.relatedId}`);
    } else if (notification.relatedType === 'listing' && notification.relatedId) {
      router.push(`/listings/${notification.relatedId}`);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-background-secondary transition-colors"
        aria-label="Notifications"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-card border border-border rounded-lg shadow-lg z-50 max-h-[32rem] overflow-hidden flex flex-col" style={{ backgroundColor: 'var(--card)' }}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-card">
            <h3 className="font-semibold text-lg text-foreground">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-primary hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto bg-card">
            {isLoading && notifications.length === 0 ? (
              <div className="p-8 text-center text-foreground-secondary bg-card">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-foreground-secondary bg-card">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 mx-auto mb-2 opacity-50"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="bg-card">
                {notifications.map(notification => (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full text-left p-4 border-b border-border hover:bg-background-secondary transition-colors ${
                      !notification.read ? 'bg-blue-50 dark:bg-blue-950/20' : 'bg-card'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon based on type */}
                      <div className="flex-shrink-0 mt-1">
                        {notification.type === 'message' && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                          </svg>
                        )}
                        {notification.type === 'rsvp' && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                          </svg>
                        )}
                        {(notification.type === 'listing_sold' || notification.type === 'listing_interest') && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                          </svg>
                        )}
                        {notification.type === 'event_update' && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${!notification.read ? 'text-foreground' : 'text-foreground-secondary'}`}>
                          {notification.title}
                        </p>
                        <p className="text-sm text-foreground-secondary mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-foreground-secondary mt-1">
                          {new Date(notification.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>

                      {/* Unread Indicator */}
                      {!notification.read && (
                        <div className="flex-shrink-0">
                          <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-border text-center bg-card">
              <button
                onClick={() => {
                  setIsOpen(false);
                  router.push('/notifications');
                }}
                className="text-sm text-primary hover:underline"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
