
'use client';

import ChatInterface from '@/components/chat/ChatInterface';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { currentUser, isLoading } = useAuth();
  const router = useRouter();
  
  // State for the initial "Loading your experience..." loader (0.79s)
  const [minInitialLoaderTimeElapsed, setMinInitialLoaderTimeElapsed] = useState(false);
  
  // State for the "Getting started..." loader (1.5s after successful login & initial load)
  const [isGettingStarted, setIsGettingStarted] = useState(false);
  const [gettingStartedCompleted, setGettingStartedCompleted] = useState(false);

  useEffect(() => {
    // Timer for the initial 0.79s loader
    const timer = setTimeout(() => setMinInitialLoaderTimeElapsed(true), 790);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Handles redirection if no user is found after auth check and initial loader time
    if (!isLoading && !currentUser && minInitialLoaderTimeElapsed) {
      router.push('/auth/login');
    }
  }, [currentUser, isLoading, minInitialLoaderTimeElapsed, router]);

  useEffect(() => {
    // This effect triggers the "Getting Started" loader sequence
    // It runs if:
    // 1. Auth check is complete (!isLoading)
    // 2. User is logged in (currentUser exists)
    // 3. Initial loader's minimum time has passed (minInitialLoaderTimeElapsed)
    // 4. "Getting Started" sequence hasn't already completed (gettingStartedCompleted is false)
    if (!isLoading && currentUser && minInitialLoaderTimeElapsed && !gettingStartedCompleted) {
      setIsGettingStarted(true); // Start showing the "Getting Started" loader
      const timer = setTimeout(() => {
        setGettingStartedCompleted(true); // Mark "Getting Started" as done
        setIsGettingStarted(false); // Stop showing the "Getting Started" loader
      }, 1500); // 1.5 seconds
      return () => clearTimeout(timer); // Cleanup timer on component unmount or if dependencies change
    }
  }, [currentUser, isLoading, minInitialLoaderTimeElapsed, gettingStartedCompleted]);

  // Render Logic:

  // Stage 1: Auth context is loading OR initial loader minimum time (0.79s) not yet met
  if (isLoading || !minInitialLoaderTimeElapsed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-xl">Loading your experience...</p>
      </div>
    );
  }

  // Stage 2: Auth check done, min initial loader time met. Now check for user.
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

  // At this point: !isLoading, currentUser exists, and minInitialLoaderTimeElapsed is true.

  // Stage 3: "Getting started..." loader is active
  if (isGettingStarted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-xl">Getting started...</p>
      </div>
    );
  }
  
  // Stage 4: All loading phases complete (initial and "Getting Started"), user exists. Show ChatInterface.
  if (gettingStartedCompleted) {
     return <ChatInterface />;
  }

  // Fallback: This state should ideally be very brief or not reached if logic flows correctly.
  // It covers the moment between the initial loader finishing and the "Getting Started" loader beginning,
  // or if there's any unexpected state.
  return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-xl">Preparing chat...</p> 
      </div>
  );
}
