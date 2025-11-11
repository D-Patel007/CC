'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  read: boolean;
  relatedId?: string;
  relatedType?: string;
  createdAt: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: [notificationId] }),
      });
      
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllAsRead: true }),
      });
      
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notificationId: number) => {
    try {
      await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      });
      
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // Navigate based on notification type
    if (notification.relatedType === 'message' || notification.relatedType === 'conversation') {
      router.push('/messages');
    } else if (notification.relatedType === 'event' && notification.relatedId) {
      router.push(`/events/${notification.relatedId}`);
    } else if (notification.relatedType === 'listing' && notification.relatedId) {
      router.push(`/listings/${notification.relatedId}`);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
          </svg>
        );
      case 'rsvp':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
          </svg>
        );
      case 'listing_sold':
      case 'listing_interest':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
            <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
          </svg>
        );
      case 'event_update':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
          </svg>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Notifications</h1>
        {notifications.some(n => !n.read) && (
          <button
            onClick={markAllAsRead}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
          >
            Mark All as Read
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-lg border border-border">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-16 w-16 mx-auto mb-4 text-foreground-secondary opacity-50"
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
          <p className="text-xl text-foreground-secondary">No notifications yet</p>
          <p className="text-sm text-foreground-secondary mt-2">When you get notifications, they'll show up here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(notification => (
            <div
              key={notification.id}
              className={`bg-card border border-border rounded-lg p-4 hover:border-primary transition-colors ${
                !notification.read ? 'bg-blue-50 dark:bg-blue-950/20' : ''
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="flex-shrink-0 mt-1">
                  {getNotificationIcon(notification.type)}
                </div>

                {/* Content */}
                <div 
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => handleNotificationClick(notification)}
                >
                  <p className={`font-medium ${!notification.read ? 'text-foreground' : 'text-foreground-secondary'}`}>
                    {notification.title}
                  </p>
                  <p className="text-sm text-foreground-secondary mt-1">
                    {notification.message}
                  </p>
                  <p className="text-xs text-foreground-secondary mt-2">
                    {new Date(notification.createdAt).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {!notification.read && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notification.id);
                      }}
                      className="px-3 py-1 text-sm text-primary hover:bg-primary/10 rounded transition"
                      title="Mark as read"
                    >
                      ✓
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification.id);
                    }}
                    className="px-3 py-1 text-sm text-red-500 hover:bg-red-500/10 rounded transition"
                    title="Delete"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
