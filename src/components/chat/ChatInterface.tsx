
'use client';

import { useState, useEffect } from 'react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { manageConversationContext, type ManageConversationContextInput, type ManageConversationContextOutput } from '@/ai/flows/manage-conversation-context';
import { useToast } from '@/hooks/use-toast';
import { Sparkles } from 'lucide-react';

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
}

interface PendingAIRequest {
  userInput: string;
  historyForAI: Array<{ role: 'user' | 'model'; content: string }>;
}

export default function ChatInterface() {
  const [inputValue, setInputValue] = useState('');
  const [conversationHistory, setConversationHistory] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [pendingAIRequest, setPendingAIRequest] = useState<PendingAIRequest | null>(null);

  useEffect(() => {
    setConversationHistory([
      {
        id: 'welcome-message',
        role: 'model',
        content: "Hello! I'm AbduDev AI, trained by Abdullah Developers. How can I help you today?",
      },
    ]);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const currentUserInput = inputValue.trim();
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: currentUserInput,
    };

    const historyForAI = conversationHistory
      .filter(msg => msg.id !== 'welcome-message' && msg.id !== 'welcome-message-cleared')
      .map(msg => ({ role: msg.role, content: msg.content }));

    setConversationHistory(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setPendingAIRequest({ userInput: currentUserInput, historyForAI });
  };

  useEffect(() => {
    if (pendingAIRequest) {
      const callAI = async () => {
        try {
          const aiInput: ManageConversationContextInput = {
            userInput: pendingAIRequest.userInput,
            conversationHistory: pendingAIRequest.historyForAI,
          };
          
          const result: ManageConversationContextOutput = await manageConversationContext(aiInput);
          
          const aiMessage: Message = {
            id: `model-${Date.now()}`,
            role: 'model',
            content: result.response,
          };
          setConversationHistory(prev => [...prev, aiMessage]);
        } catch (error) {
          console.error('Error calling AI:', error);
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to get response from AbduDev AI. Please check your configuration and try again.',
          });
        } finally {
          setIsLoading(false);
          setPendingAIRequest(null);
        }
      };
      callAI();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingAIRequest, toast]);

  const handleClearContext = () => {
    setConversationHistory([
      {
        id: 'welcome-message-cleared',
        role: 'model',
        content: "Context cleared. How can I help you now?",
      },
    ]);
    toast({
        title: 'Context Cleared',
        description: 'The conversation history has been reset.',
    });
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="p-4 border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <h1 className="text-2xl font-headline font-semibold flex items-center gap-2 text-primary">
          <Sparkles size={28} className="animate-futuristic-pulse text-accent" />
          AbduDev AI
        </h1>
      </header>
      <main className="flex-grow flex flex-col overflow-hidden">
        <MessageList messages={conversationHistory} isLoading={isLoading} />
        <MessageInput
          inputValue={inputValue}
          onInputChange={handleInputChange}
          onSubmit={handleSubmit}
          onClear={handleClearContext}
          isLoading={isLoading}
          canClear={conversationHistory.filter(msg => msg.id !== 'welcome-message' && msg.id !== 'welcome-message-cleared').length > 0}
        />
      </main>
    </div>
  );
}
