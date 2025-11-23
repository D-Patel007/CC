'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface PhoneVerificationBannerProps {
  profileId: number;
}

export default function PhoneVerificationBanner({ profileId }: PhoneVerificationBannerProps) {
  const [phoneVerified, setPhoneVerified] = useState<boolean | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if banner was dismissed
    const isDismissed = localStorage.getItem('phoneVerificationBannerDismissed') === 'true';
    setDismissed(isDismissed);

    // Fetch phone verification status
    const checkPhoneStatus = async () => {
      try {
        const res = await fetch('/api/profile');
        if (res.ok) {
          const data = await res.json();
          setPhoneVerified(data.data?.phoneVerified || false);
        }
      } catch (error) {
        console.error('Error checking phone status:', error);
      }
    };

    checkPhoneStatus();
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('phoneVerificationBannerDismissed', 'true');
    setDismissed(true);
  };

  const handleVerify = () => {
    router.push('/verify-phone');
  };

  // Don't show if already verified, still loading, or dismissed
  if (phoneVerified === null || phoneVerified === true || dismissed) {
    return null;
  }

  return (
    <div className="mb-6 rounded-xl border-2 border-green-500/30 bg-gradient-to-r from-green-500/10 via-blue-500/10 to-purple-500/10 p-6 shadow-subtle animate-fade-in">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 text-4xl">
          📱
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-foreground mb-1">
            Verify Your Phone Number
          </h3>
          <p className="text-sm text-foreground-secondary mb-4">
            Build trust with the community and get a verified badge! Phone verification helps prevent spam and builds credibility.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleVerify}
              className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-hover transition shadow-subtle"
            >
              Verify Now
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2 border border-border rounded-lg hover:bg-[var(--background-secondary)] transition text-foreground-secondary"
            >
              Maybe Later
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-foreground-secondary hover:text-foreground transition"
          aria-label="Dismiss"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
