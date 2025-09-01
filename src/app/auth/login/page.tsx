
'use client';

import AuthForm from '@/components/auth/AuthForm';
import { useAuth } from '@/context/AuthContext';
import type React from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { currentUser, isLoading } = useAuth();
  const router = useRouter();

   useEffect(() => {
    if (!isLoading && currentUser) {
      router.push('/');
    }
  }, [currentUser, isLoading, router]);


  if (isLoading || (!isLoading && currentUser)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return <AuthForm mode="login" />;
}
