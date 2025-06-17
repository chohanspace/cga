
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

const MAX_MESSAGES = 100; // Limit the number of messages stored
const LIVE_CHAT_MESSAGES_KEY = 'harium_live_chat_messages';
const THIRTY_MINUTES_MS = 30 * 60 * 1000;


export default function LiveChatInterface() {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<LiveMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!currentUser) return;

    let loadedMessages: LiveMessage[] = [];
    const storedMessages = localStorage.getItem(LIVE_CHAT_MESSAGES_KEY);
    const now = Date.now();

    if (storedMessages) {
      try {
        const parsedMessages: LiveMessage[] = JSON.parse(storedMessages);
        loadedMessages = parsedMessages.filter(msg => (now - msg.timestamp) < THIRTY_MINUTES_MS);
      } catch (e) {
        console.error("Failed to parse live chat messages from localStorage", e);
        localStorage.removeItem(LIVE_CHAT_MESSAGES_KEY); // Clear corrupted data
      }
    }

    if (loadedMessages.length === 0) {
      loadedMessages.push({
        id: 'system-welcome',
        sender: { username: 'System', nickname: 'System' },
        content: `Welcome to the Live Chat, ${currentUser.nickname || currentUser.username}! Messages are stored in your browser for 30 minutes. This is a frontend simulation; messages are not shared with others in real-time.`,
        timestamp: Date.now(),
      });
    }
    
    const finalInitialMessages = loadedMessages.slice(-MAX_MESSAGES);
    setMessages(finalInitialMessages);

    // Save the potentially cleaned/welcomed list back to localStorage
    try {
      localStorage.setItem(LIVE_CHAT_MESSAGES_KEY, JSON.stringify(finalInitialMessages));
    } catch (e) {
        console.error("Failed to save initial messages to localStorage", e);
    }

  }, [currentUser]);


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

    // Simulate sending delay
    setTimeout(() => {
      setMessages(prevMessages => {
        const now = Date.now();
        const updatedWithNew = [...prevMessages, newMessage];
        // Filter by timestamp first, then cap by MAX_MESSAGES
        const recentMessages = updatedWithNew.filter(msg => (now - msg.timestamp) < THIRTY_MINUTES_MS);
        const finalMessages = recentMessages.slice(-MAX_MESSAGES);
        
        try {
          localStorage.setItem(LIVE_CHAT_MESSAGES_KEY, JSON.stringify(finalMessages));
        } catch (storageError) {
          console.error("Failed to save messages to localStorage", storageError);
          toast({ variant: "destructive", title: "Storage Error", description: "Could not save message locally." });
        }
        return finalMessages;
      });
      setInputValue('');
      setIsSending(false);
    }, 300); 
  };
  
  const handleGoBack = () => {
    router.push('/'); 
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
