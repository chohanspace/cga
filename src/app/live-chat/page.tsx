
'use client';

import LiveChatInterface from '@/components/live-chat/LiveChatInterface';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function LiveChatPage() {
  const { currentUser, isLoading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    // If auth is done loading and there's no user, redirect to login.
    if (!isLoading && !currentUser) {
      router.push('/auth/login');
    }
  }, [currentUser, isLoading, router]);

  // Show authenticating message while auth is loading.
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-xl">Authenticating...</p>
      </div>
    );
  }

  // If auth is done, but there's no current user (and redirect effect hasn't completed yet or is in progress).
  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-xl">Redirecting to login...</p>
      </div>
    );
  }
  
  // If isLoading is false AND currentUser exists, render the chat interface.
  // The "Preparing Live Chat..." state and its timeout have been removed for simplicity.
  return <LiveChatInterface />;
}
