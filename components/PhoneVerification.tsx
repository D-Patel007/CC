'use client';

import { useState } from 'react';

interface PhoneVerificationProps {
  onVerified?: () => void;
  initialPhone?: string;
}

export default function PhoneVerification({ onVerified, initialPhone = '' }: PhoneVerificationProps) {
  const [step, setStep] = useState<'enter-phone' | 'enter-code'>('enter-phone');
  const [phone, setPhone] = useState(initialPhone);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [devCode, setDevCode] = useState(''); // For development mode

  // Format phone number as user types
  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
    return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
    setError('');
  };

  const sendCode = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    setDevCode('');

    try {
      // Extract just the numbers
      const cleanPhone = phone.replace(/\D/g, '');
      
      if (cleanPhone.length !== 10) {
        setError('Please enter a valid 10-digit phone number');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/phone/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(data.message);
        setStep('enter-code');
        
        // If in dev mode, show the code
        if (data.devMode || data.code) {
          setDevCode(data.code);
        }
      } else {
        setError(data.error || 'Failed to send verification code');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (code.length !== 6) {
        setError('Please enter the 6-digit code');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/phone/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(data.message);
        setTimeout(() => {
          if (onVerified) onVerified();
        }, 1500);
      } else {
        setError(data.error || 'Invalid verification code');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const requestNewCode = () => {
    setStep('enter-phone');
    setCode('');
    setError('');
    setMessage('');
    setDevCode('');
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="rounded-xl border border-border bg-[var(--card-bg)] p-6 shadow-subtle">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">📱</div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Verify Your Phone Number
          </h2>
          <p className="text-sm text-foreground-secondary">
            Add an extra layer of security and build trust with other users
          </p>
        </div>

        {/* Step 1: Enter Phone Number */}
        {step === 'enter-phone' && (
          <div className="space-y-4">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-2">
                Phone Number
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="(555) 123-4567"
                maxLength={14}
                className="w-full rounded-lg border border-border bg-[var(--input-bg)] px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <p className="text-xs text-foreground-secondary mt-1">
                We'll send you a 6-digit verification code
              </p>
            </div>

            <button
              onClick={sendCode}
              disabled={loading || phone.length < 10}
              className="w-full rounded-lg bg-primary px-6 py-3 text-white font-medium shadow-subtle hover:bg-primary-hover transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Sending...
                </span>
              ) : (
                'Send Verification Code'
              )}
            </button>
          </div>
        )}

        {/* Step 2: Enter Verification Code */}
        {step === 'enter-code' && (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <p className="text-sm text-foreground-secondary">
                Code sent to <span className="font-semibold text-foreground">{phone}</span>
              </p>
              <button
                onClick={requestNewCode}
                className="text-sm text-primary hover:underline mt-1"
              >
                Change number
              </button>
            </div>

            {devCode && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-center">
                <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium mb-1">
                  🔧 Development Mode
                </p>
                <p className="text-lg font-mono font-bold text-yellow-700 dark:text-yellow-300">
                  {devCode}
                </p>
              </div>
            )}

            <div>
              <label htmlFor="code" className="block text-sm font-medium text-foreground mb-2">
                Verification Code
              </label>
              <input
                id="code"
                type="text"
                value={code}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setCode(val);
                  setError('');
                }}
                placeholder="123456"
                maxLength={6}
                className="w-full rounded-lg border border-border bg-[var(--input-bg)] px-4 py-3 text-center text-2xl font-mono font-bold tracking-widest text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <p className="text-xs text-foreground-secondary mt-1 text-center">
                Enter the 6-digit code sent to your phone
              </p>
            </div>

            <button
              onClick={verifyCode}
              disabled={loading || code.length !== 6}
              className="w-full rounded-lg bg-primary px-6 py-3 text-white font-medium shadow-subtle hover:bg-primary-hover transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Verifying...
                </span>
              ) : (
                'Verify Phone Number'
              )}
            </button>

            <button
              onClick={sendCode}
              disabled={loading}
              className="w-full text-sm text-primary hover:underline"
            >
              Didn't receive the code? Resend
            </button>
          </div>
        )}

        {/* Messages */}
        {message && (
          <div className="mt-4 rounded-lg bg-green-500/10 border border-green-500/30 p-3 text-center text-sm text-green-600 dark:text-green-400">
            {message}
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-center text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Benefits */}
        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-xs font-semibold text-foreground mb-2">Why verify your phone?</p>
          <ul className="space-y-1 text-xs text-foreground-secondary">
            <li>✓ Get a verified badge on your profile</li>
            <li>✓ Build trust with buyers and sellers</li>
            <li>✓ Reduce spam and fake accounts</li>
            <li>✓ Priority support access</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
