
import type { Message } from './ChatInterface';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { User, Bot, Image as ImageIcon, Loader2 } from 'lucide-react';
import React from 'react';
import NextImage from 'next/image'; // Using NextImage for optimization

interface MessageItemProps {
  message: Message;
}

const renderFormattedMessage = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
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
          'max-w-[75%] p-3 shadow-lg text-sm flex flex-col gap-2',
          isUser
            ? 'bg-primary text-primary-foreground rounded-lg rounded-br-sm border border-primary/70'
            : 'bg-card text-card-foreground rounded-lg rounded-bl-sm border border-border/70'
        )}
      >
        {message.content && <p className="whitespace-pre-wrap">{renderFormattedMessage(message.content)}</p>}
        
        {message.attachment && (
          <div className="mt-2 border-t border-border/30 pt-2">
            <p className="text-xs text-muted-foreground mb-1">Attached: {message.attachment.name}</p>
            <NextImage
              src={message.attachment.url}
              alt={message.attachment.name || 'Attached image'}
              width={300}
              height={200}
              className="rounded-md object-contain max-h-60 w-auto"
              data-ai-hint="attached image"
            />
          </div>
        )}

        {message.isGeneratingImage && !message.imageUrl && (
           <div className="flex items-center gap-2 text-muted-foreground p-2 rounded-md bg-background/30">
            <Loader2 size={16} className="animate-spin" />
            <span>Generating image...</span>
          </div>
        )}
        
        {message.imageUrl && (
          <div className="mt-2">
            <NextImage
              src={message.imageUrl}
              alt="Generated image"
              width={400} 
              height={400}
              className="rounded-md object-contain max-h-96 w-auto shadow-md"
              data-ai-hint="generated art"
            />
          </div>
        )}
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
