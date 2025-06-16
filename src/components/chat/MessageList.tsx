import type { Message } from './ChatInterface';
import MessageItem from './MessageItem';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEffect, useRef } from 'react';
import { Bot } from 'lucide-react'; // Added import for Bot

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
}

export default function MessageList({ messages, isLoading }: MessageListProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  return (
    <ScrollArea className="flex-grow h-[calc(100vh-200px)]" ref={scrollAreaRef}>
      <div className="p-4 space-y-4" ref={viewportRef}>
        {messages.map((msg) => (
          <MessageItem key={msg.id} message={msg} />
        ))}
        {isLoading && messages.length > 0 && messages[messages.length-1].role === 'user' && (
          <div className="flex justify-start">
             <div className="flex items-center gap-2 p-3 rounded-lg bg-card text-card-foreground border max-w-[70%] animate-pulse">
              <Bot size={18} className="text-primary"/>
              <span className="text-sm">AbduDev AI is thinking...</span>
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
