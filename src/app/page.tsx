
'use client';

import ChatInterface from '@/components/chat/ChatInterface';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { currentUser, isLoading } = useAuth();
  const router = useRouter();
  
  // State for the "Getting started..." loader (1.5s after successful login & initial auth load)
  const [isGettingStarted, setIsGettingStarted] = useState(false);
  const [gettingStartedCompleted, setGettingStartedCompleted] = useState(false);

  useEffect(() => {
    // Handles redirection if no user is found after auth check
    if (!isLoading && !currentUser) {
      router.push('/auth/login');
    }
  }, [currentUser, isLoading, router]);

  useEffect(() => {
    // This effect triggers the "Getting Started" loader sequence
    // It runs if:
    // 1. Auth check is complete (!isLoading)
    // 2. User is logged in (currentUser exists)
    // 3. "Getting Started" sequence hasn't already completed (gettingStartedCompleted is false)
    if (!isLoading && currentUser && !gettingStartedCompleted) {
      setIsGettingStarted(true); 
      const timer = setTimeout(() => {
        setGettingStartedCompleted(true); 
        setIsGettingStarted(false); 
      }, 1500); // 1.5 seconds
      return () => clearTimeout(timer); 
    }
  }, [currentUser, isLoading, gettingStartedCompleted]);

  // Render Logic:

  // Stage 1: Auth context is loading.
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-xl">Authenticating...</p>
      </div>
    );
  }

  // Stage 2: Auth check done. Now check for user.
  if (!currentUser) {
    // No user is logged in. Redirection to /auth/login is handled by the useEffect above.
    // Show a loader during this brief period.
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-xl">Redirecting...</p>
      </div>
    );
  }

  // At this point: !isLoading, currentUser exists.

  // Stage 3: "Getting started..." loader is active
  if (isGettingStarted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-xl">Getting started...</p>
      </div>
    );
  }
  
  // Stage 4: All loading phases complete, user exists. Show ChatInterface.
  if (gettingStartedCompleted) {
     return <ChatInterface />;
  }

  // Fallback: This state covers the moment auth is done, user exists, 
  // but "Getting Started" hasn't kicked in yet.
  return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-xl">Preparing chat...</p> 
      </div>
  );
}
