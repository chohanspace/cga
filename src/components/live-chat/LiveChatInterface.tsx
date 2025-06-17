
'use client';

import { useState, useEffect, useCallback } from 'react';
import LiveMessageList from './LiveMessageList';
import LiveMessageInput from './LiveMessageInput';
import { useAuth, type UserProfile } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';

export interface LiveMessage {
  id: string;
  sender: UserProfile;
  content: string;
  timestamp: number;
}

const MAX_MESSAGES = 100; // Limit the number of messages stored in state

export default function LiveChatInterface() {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<LiveMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  // Placeholder: Welcome message
  useEffect(() => {
    if (currentUser && messages.length === 0) {
      setMessages([
        {
          id: 'system-welcome',
          sender: { username: 'System', nickname: 'System' }, // Mock system user
          content: `Welcome to the Live Chat, ${currentUser.nickname || currentUser.username}! This is a frontend simulation. Messages are not saved permanently or shared with other users in real-time.`,
          timestamp: Date.now(),
        },
      ]);
    }
  }, [currentUser, messages.length]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const content = inputValue.trim();

    if (!content || !currentUser || isSending) return;

    setIsSending(true);

    const newMessage: LiveMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sender: currentUser,
      content,
      timestamp: Date.now(),
    };

    // Simulate sending delay and add message
    setTimeout(() => {
      setMessages(prevMessages => {
        const updatedMessages = [...prevMessages, newMessage];
        // Keep only the last MAX_MESSAGES
        return updatedMessages.slice(-MAX_MESSAGES);
      });
      setInputValue('');
      setIsSending(false);
    }, 300); // Short delay to simulate network
  };
  
  const handleGoBack = () => {
    router.push('/'); // Navigate to AI chat or main page
  };

  return (
    <div className="flex flex-col h-screen bg-transparent shadow-2xl rounded-lg overflow-hidden m-2 md:m-4 lg:mx-auto lg:max-w-4xl border border-border/30">
      <header className="p-4 border-b border-border/50 bg-card/70 backdrop-blur-md sticky top-0 z-10 shadow-md flex justify-between items-center">
        <div className="flex items-center gap-2">
           <Button variant="ghost" size="icon" onClick={handleGoBack} aria-label="Back to AI Chat">
            <ArrowLeft size={20} />
          </Button>
          <Users className="h-6 w-6 text-primary" />
          <h1 className="text-xl md:text-2xl font-headline font-semibold text-primary">
            Live Group Chat
          </h1>
        </div>
        {currentUser && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:inline">As: {currentUser.nickname || currentUser.username}</span>
          </div>
        )}
      </header>
      <main className="flex-grow flex flex-col overflow-hidden">
        <LiveMessageList messages={messages} currentUser={currentUser} />
        <LiveMessageInput
          inputValue={inputValue}
          onInputChange={handleInputChange}
          onSubmit={handleSubmit}
          isLoading={isSending}
        />
      </main>
    </div>
  );
}
