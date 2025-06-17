
'use client';

import LiveChatInterface from '@/components/live-chat/LiveChatInterface';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function LiveChatPage() {
  const { currentUser, isLoading } = useAuth();
  const router = useRouter();
  
  const [isPreparingChat, setIsPreparingChat] = useState(false);
  const [preparationCompleted, setPreparationCompleted] = useState(false);

  useEffect(() => {
    if (!isLoading && !currentUser) {
      router.push('/auth/login');
    }
  }, [currentUser, isLoading, router]);

  useEffect(() => {
    if (!isLoading && currentUser && !preparationCompleted) {
      setIsPreparingChat(true); 
      const timer = setTimeout(() => {
        setPreparationCompleted(true); 
        setIsPreparingChat(false); 
      }, 1000); 
      return () => clearTimeout(timer); 
    }
  }, [currentUser, isLoading, preparationCompleted]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-xl">Authenticating...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-xl">Redirecting...</p>
      </div>
    );
  }

  if (isPreparingChat) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-xl">Preparing Live Chat...</p>
      </div>
    );
  }
  
  if (preparationCompleted) {
     return <LiveChatInterface />;
  }

  return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-xl">Loading Live Chat Interface...</p> 
      </div>
  );
}
