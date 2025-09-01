
'use client';

import ChatInterface from '@/components/chat/ChatInterface';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { currentUser, isLoading } = useAuth();
  const router = useRouter();
  
  const [isGettingStarted, setIsGettingStarted] = useState(false);
  const [gettingStartedCompleted, setGettingStartedCompleted] = useState(false);

  useEffect(() => {
    if (!isLoading && !currentUser) {
      router.push('/auth/login');
    }
  }, [currentUser, isLoading, router]);

  useEffect(() => {
    if (!isLoading && currentUser && !gettingStartedCompleted) {
      setIsGettingStarted(true); 
      const timer = setTimeout(() => {
        setGettingStartedCompleted(true); 
        setIsGettingStarted(false); 
      }, 2000); // Changed from 1500ms to 2000ms (2 seconds)
      return () => clearTimeout(timer); 
    }
  }, [currentUser, isLoading, gettingStartedCompleted]);


  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary-gradient mb-4" />
        <p className="text-xl">Authenticating...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary-gradient mb-4" />
        <p className="text-xl">Redirecting...</p>
      </div>
    );
  }


  if (isGettingStarted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary-gradient mb-4" />
        <p className="text-xl">Getting started...</p>
      </div>
    );
  }
  
  if (gettingStartedCompleted) {
     return <ChatInterface />;
  }

  return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary-gradient mb-4" />
        <p className="text-xl">Preparing chat...</p> 
      </div>
  );
}
