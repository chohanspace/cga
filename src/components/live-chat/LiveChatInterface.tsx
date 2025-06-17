
'use client';

import { useState, useEffect, useCallback } from 'react';
import LiveMessageList from './LiveMessageList';
import LiveMessageInput from './LiveMessageInput';
import { useAuth, type UserProfile } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { manageConversationContext, type ManageConversationContextInput, type ManageConversationContextOutput } from '@/ai/flows/manage-conversation-context';

export interface LiveMessage {
  id: string;
  sender: UserProfile; 
  content: string;
  timestamp: number;
  isThinking?: boolean; 
}

const MAX_MESSAGES_DISPLAY = 50; // Cap displayed messages for performance
const HARIUM_AI_USERNAME = 'HariumAI_Assistant';
const HARIUM_AI_NICKNAME = 'Harium AI';
const HARIUM_AI_MENTION = '@hariumai';

const hariumAiProfile: UserProfile = {
  username: HARIUM_AI_USERNAME,
  nickname: HARIUM_AI_NICKNAME,
  pfpUrl: '', 
};


export default function LiveChatInterface() {
  const [inputValue, setInputValue] = useState('');
  // Initialize with a very simple static welcome message
  const [messages, setMessages] = useState<LiveMessage[]>([
    {
      id: 'system-welcome-basic',
      sender: { username: 'System', nickname: 'System' },
      content: `Welcome to Live Chat! Type "${HARIUM_AI_MENTION} <your query>" to talk to Harium AI. Messages are in-memory and will be lost on refresh.`,
      timestamp: Date.now(),
    }
  ]);
  const [isSending, setIsSending] = useState(false);
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  // useEffect for currentUser dependent actions can be added back later if needed,
  // for now, we keep initial message static.

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  // Simplified: Only manages in-memory state
  const addMessageToList = (newMessage: LiveMessage) => {
    setMessages(prevMessages => [...prevMessages, newMessage].slice(-MAX_MESSAGES_DISPLAY));
  };

  // Simplified: Only manages in-memory state
  const updateMessageInList = (updatedMessage: LiveMessage) => {
    setMessages(prevMessages =>
      prevMessages.map(msg => msg.id === updatedMessage.id ? updatedMessage : msg).slice(-MAX_MESSAGES_DISPLAY)
    );
  };


  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const content = inputValue.trim();

    if (!content || !currentUser) return; // isSending check removed temporarily, as AI is primary async op

    setIsSending(true);

    const userMessage: LiveMessage = {
      id: `msg-user-${Date.now()}`,
      sender: currentUser,
      content,
      timestamp: Date.now(),
    };
    addMessageToList(userMessage);
    setInputValue('');

    if (content.toLowerCase().startsWith(HARIUM_AI_MENTION.toLowerCase())) {
      const aiPrompt = content.substring(HARIUM_AI_MENTION.length).trim();
      if (aiPrompt) {
        const thinkingMessageId = `msg-ai-thinking-${Date.now()}`;
        const thinkingMessage: LiveMessage = {
          id: thinkingMessageId,
          sender: hariumAiProfile,
          content: `${HARIUM_AI_NICKNAME} is thinking...`,
          timestamp: Date.now(),
          isThinking: true,
        };
        addMessageToList(thinkingMessage);

        try {
          const aiInput: ManageConversationContextInput = {
            userInput: aiPrompt,
            conversationHistory: [], 
          };
          const result: ManageConversationContextOutput = await manageConversationContext(aiInput);
          
          const aiResponseMessage: LiveMessage = {
            id: thinkingMessageId, 
            sender: hariumAiProfile,
            content: result.response,
            timestamp: Date.now(),
          };
          updateMessageInList(aiResponseMessage);

        } catch (error) {
          console.error('Error calling Harium AI in live chat:', error);
          toast({
            variant: 'destructive',
            title: 'AI Error',
            description: 'Harium AI could not respond in the chat.',
          });
          const aiErrorMessage: LiveMessage = {
            id: thinkingMessageId, 
            sender: hariumAiProfile,
            content: "Sorry, I couldn't process that request.",
            timestamp: Date.now(),
          };
          updateMessageInList(aiErrorMessage);
        } finally {
          setIsSending(false);
        }
      } else {
        // Case where "@hariumai" is typed but no prompt follows
        setIsSending(false); 
      }
    } else {
      // Not an AI command, just a regular user message
      setIsSending(false);
    }
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
          isLoading={isSending} // isLoading now primarily reflects AI thinking state
        />
      </main>
    </div>
  );
}
