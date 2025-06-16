
'use client';

import { useState, useEffect } from 'react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { manageConversationContext, type ManageConversationContextInput, type ManageConversationContextOutput } from '@/ai/flows/manage-conversation-context';
import { useToast } from '@/hooks/use-toast';

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
}

export default function ChatInterface() {
  const [inputValue, setInputValue] = useState('');
  const [conversationHistory, setConversationHistory] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const currentUserInput = inputValue.trim();

    if (!currentUserInput || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: currentUserInput,
    };

    const historyForAI = conversationHistory
      .filter(msg => msg.id !== 'welcome-message-cleared') 
      .map(msg => ({ role: msg.role, content: msg.content }));

    setConversationHistory(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const aiInput: ManageConversationContextInput = {
        userInput: currentUserInput,
        conversationHistory: historyForAI,
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
    }
  };

  const handleClearContext = () => {
    setConversationHistory([
      {
        id: 'welcome-message-cleared',
        role: 'model',
        content: "Context cleared. How can I help you now? ✨",
      },
    ]);
    toast({
        title: 'Context Cleared',
        description: 'The conversation history has been reset.',
    });
  };

  return (
    <div className="flex flex-col h-screen bg-transparent shadow-xl rounded-lg overflow-hidden m-2 md:m-4 border border-border/30">
      <header className="p-4 border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-10 shadow-md">
        <h1 className="text-2xl font-headline font-semibold text-primary">
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
          canClear={conversationHistory.filter(msg => msg.id !== 'welcome-message-cleared').length > 0}
        />
      </main>
    </div>
  );
}
