'use client';

import { useState } from 'react';

export default function NotificationTestPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');

  const createTestNotification = async () => {
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const res = await fetch('/api/notifications/test', {
        method: 'POST',
      });

      const data = await res.json();

      if (res.ok) {
        setMessage('✅ ' + data.message);
      } else {
        setError('❌ ' + (data.error || 'Failed to create test notification'));
      }
    } catch (err) {
      setError('❌ Network error: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-xl border border-border bg-[var(--card-bg)] p-8 shadow-subtle">
        <h1 className="text-3xl font-bold text-foreground mb-4">
          🧪 Notification System Test
        </h1>
        
        <p className="text-foreground-secondary mb-6">
          Click the button below to create a test notification. It should appear instantly in your notification bell 
          (top right corner) thanks to real-time Supabase subscriptions!
        </p>

        <div className="space-y-4">
          <button
            onClick={createTestNotification}
            disabled={loading}
            className="w-full rounded-lg bg-primary px-6 py-3 text-white font-medium shadow-subtle hover:bg-primary-hover transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Creating notification...
              </span>
            ) : (
              '🔔 Create Test Notification'
            )}
          </button>

          {message && (
            <div className="rounded-lg bg-green-500/10 border border-green-500/30 p-4 text-green-600 dark:text-green-400">
              {message}
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-4 text-red-600 dark:text-red-400">
              {error}
            </div>
          )}
        </div>

        <div className="mt-8 pt-8 border-t border-border">
          <h2 className="text-xl font-semibold text-foreground mb-3">How It Works</h2>
          <ul className="space-y-2 text-sm text-foreground-secondary">
            <li>✅ Real-time Supabase subscriptions listen for new notifications</li>
            <li>✅ No polling required - instant updates when notifications are created</li>
            <li>✅ Unread count updates automatically</li>
            <li>✅ Clicking a notification marks it as read and navigates to related content</li>
          </ul>
        </div>

        <div className="mt-6">
          <a
            href="/"
            className="text-primary hover:underline text-sm"
          >
            ← Back to Marketplace
          </a>
        </div>
      </div>
    </div>
  );
}
