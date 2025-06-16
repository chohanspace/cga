'use client';

import { useState, useEffect } from 'react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { manageConversationContext, type ManageConversationContextInput, type ManageConversationContextOutput } from '@/ai/flows/manage-conversation-context';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';

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

  // Welcome message
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputValue.trim(),
    };

    setConversationHistory((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const aiInput: ManageConversationContextInput = {
        userInput: userMessage.content,
        conversationHistory: conversationHistory
          .filter(msg => msg.id !== 'welcome-message') // Don't send initial welcome message as history
          .map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
      };
      
      const result: ManageConversationContextOutput = await manageConversationContext(aiInput);
      
      const aiMessage: Message = {
        id: `model-${Date.now()}`,
        role: 'model',
        content: result.response,
      };
      setConversationHistory((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error calling AI:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to get response from AbduDev AI. Please check your configuration and try again.',
      });
      // Optionally add back the user message to history if it was removed optimistically, or handle retry.
      // For now, we keep the user message.
    } finally {
      setIsLoading(false);
    }
  };

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
      <header className="p-4 border-b bg-card">
        <h1 className="text-2xl font-headline font-semibold flex items-center gap-2 text-primary">
          <Sparkles size={28} />
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
