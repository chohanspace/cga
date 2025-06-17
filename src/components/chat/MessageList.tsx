
import type { Message } from './ChatInterface';
import MessageItem from './MessageItem';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEffect, useRef } from 'react';
import { Bot } from 'lucide-react';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  isSpeechOutputEnabled: boolean;
}

export default function MessageList({ messages, isLoading, isSpeechOutputEnabled }: MessageListProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timerId = setTimeout(() => {
      if (contentRef.current?.lastElementChild) {
        contentRef.current.lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    }, 100); // Increased delay to 100ms for more robust scrolling

    return () => clearTimeout(timerId);
  }, [messages, isLoading]);

  return (
    <ScrollArea className="flex-grow h-[calc(100vh-200px)]" ref={scrollAreaRef}>
      <div className="p-4 space-y-4" ref={contentRef}>
        {messages.map((msg) => (
          <MessageItem key={msg.id} message={msg} isSpeechOutputEnabled={isSpeechOutputEnabled} />
        ))}
        {isLoading && messages.length > 0 && messages[messages.length-1].role === 'user' && (
          <div className="flex justify-start animate-message-in">
             <div className="flex items-center gap-2 p-3 rounded-lg bg-card/70 backdrop-blur-sm text-card-foreground border border-border/40 max-w-[70%]">
              <Bot size={18} className="text-primary animate-pulse"/>
              <span className="text-sm">Harium AI is thinking...</span>
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
