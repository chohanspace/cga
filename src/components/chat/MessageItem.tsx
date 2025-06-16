import type { Message } from './ChatInterface';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { User, Bot } from 'lucide-react';
import React from 'react';

interface MessageItemProps {
  message: Message;
}

// Helper function to render text with **bold** markdown
const renderFormattedMessage = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*)/g); // Split by **text**
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
};

export default function MessageItem({ message }: MessageItemProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-1 animate-message-in',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {!isUser && (
        <Avatar className="h-8 w-8 shrink-0 border border-accent/50 shadow-md">
          <AvatarFallback className="bg-accent text-accent-foreground">
            <Bot size={18} />
          </AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          'max-w-[75%] p-3 shadow-lg text-sm',
          isUser
            ? 'bg-primary text-primary-foreground rounded-lg rounded-br-sm border border-primary/70'
            : 'bg-card text-card-foreground rounded-lg rounded-bl-sm border border-border/70'
        )}
      >
        <p className="whitespace-pre-wrap">{renderFormattedMessage(message.content)}</p>
      </div>
      {isUser && (
        <Avatar className="h-8 w-8 shrink-0 border border-primary/50 shadow-md">
          <AvatarFallback className="bg-primary text-primary-foreground">
            <User size={18} />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
