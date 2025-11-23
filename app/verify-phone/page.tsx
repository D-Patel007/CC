'use client';

import { useRouter } from 'next/navigation';
import PhoneVerification from '@/components/PhoneVerification';

export default function PhoneVerificationPage() {
  const router = useRouter();

  const handleVerified = () => {
    // Redirect to profile after successful verification
    setTimeout(() => {
      router.push('/profile');
    }, 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="w-full">
        <PhoneVerification onVerified={handleVerified} />
        
        <div className="text-center mt-6">
          <a
            href="/profile"
            className="text-sm text-primary hover:underline"
          >
            Skip for now
          </a>
        </div>
      </div>
    </div>
  );
}
