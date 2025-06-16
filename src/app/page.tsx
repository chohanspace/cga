
'use client';

import ChatInterface from '@/components/chat/ChatInterface';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { currentUser, isLoading } = useAuth();
  const router = useRouter();
  const [minLoaderTimeElapsed, setMinLoaderTimeElapsed] = useState(false);

  useEffect(() => {
    // Handles redirection if no user is found after auth check
    if (!isLoading && !currentUser) {
      router.push('/auth/login');
    }
  }, [currentUser, isLoading, router]);

  useEffect(() => {
    // Sets a minimum display time for the loader
    const timer = setTimeout(() => {
      setMinLoaderTimeElapsed(true);
    }, 790); // 0.79 seconds

    return () => clearTimeout(timer); // Cleanup timer on component unmount
  }, []);

  // Show ChatInterface only if all conditions are met:
  // 1. Auth context is done loading
  // 2. A current user exists
  // 3. The minimum loader display time has passed
  if (!isLoading && currentUser && minLoaderTimeElapsed) {
    return <ChatInterface />;
  } else {
    // Otherwise, show the loading screen.
    // This covers cases where:
    // - isLoading is true (auth context still loading).
    // - !currentUser is true (auth context done, but no user - redirection is pending from the other useEffect).
    // - currentUser is true, but !minLoaderTimeElapsed (auth context done, user exists, but min display time not up).
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-xl">Loading your experience...</p>
      </div>
    );
  }
}
