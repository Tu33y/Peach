'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AccountTypePage() {
  const router = useRouter();
  useEffect(() => {
    router.push('/register');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <span className="text-sm font-semibold text-gray-500 animate-pulse">Redirecting to register...</span>
    </div>
  );
}
