
'use client';

import type { LiveMessage } from './LiveChatInterface';
import type { UserProfile } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { User, Bot, Loader2 } from 'lucide-react'; 

interface LiveMessageItemProps {
  message: LiveMessage;
  currentUser: UserProfile;
}

const HARIUM_AI_USERNAME = 'HariumAI_Assistant'; // Ensure this matches the one in LiveChatInterface

export default function LiveMessageItem({ message, currentUser }: LiveMessageItemProps) {
  const isCurrentUserMessage = message.sender.username === currentUser.username;
  const isSystemMessage = message.sender.username === 'System';
  const isHariumAiMessage = message.sender.username === HARIUM_AI_USERNAME;

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (isSystemMessage) {
    return (
      <div className="flex justify-center my-2 animate-message-in">
        <div className="px-3 py-1.5 text-xs text-center text-muted-foreground bg-muted/50 backdrop-blur-sm rounded-full shadow-sm">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-end gap-2.5 animate-message-in',
        isCurrentUserMessage ? 'justify-end' : 'justify-start'
      )}
    >
      {!isCurrentUserMessage && (
        <Avatar className="h-8 w-8 shrink-0 border border-border/50 shadow-md">
          {message.sender.pfpUrl && !isHariumAiMessage ? (
            <AvatarImage src={message.sender.pfpUrl} alt={message.sender.nickname || message.sender.username} />
          ) : (
            <AvatarFallback className={cn(
              "bg-secondary text-secondary-foreground",
              isHariumAiMessage && "bg-accent text-accent-foreground"
            )}>
              {isHariumAiMessage ? <Bot size={18} /> : <User size={18} />}
            </AvatarFallback>
          )}
        </Avatar>
      )}
      <div
        className={cn(
          'relative max-w-[70%] p-3 shadow-lg text-sm flex flex-col gap-0.5',
          isCurrentUserMessage
            ? 'bg-primary/70 backdrop-blur-sm text-primary-foreground rounded-lg rounded-br-sm border border-primary/40'
            : isHariumAiMessage 
              ? 'bg-accent/70 backdrop-blur-sm text-accent-foreground rounded-lg rounded-bl-sm border border-accent/40'
              : 'bg-card/70 backdrop-blur-sm text-card-foreground rounded-lg rounded-bl-sm border border-border/40'
        )}
      >
        {!isCurrentUserMessage && (
          <p className={cn(
            "text-xs font-semibold mb-0.5",
            isHariumAiMessage ? "text-accent-foreground/80" : "text-accent"
            )}>
            {message.sender.nickname || message.sender.username}
          </p>
        )}
        {message.isThinking ? (
          <div className="flex items-center gap-2">
            <Loader2 size={16} className="animate-spin" />
            <span>{message.content}</span>
          </div>
        ) : (
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        )}
        <p className={cn(
            "text-xs opacity-70 mt-1",
            isCurrentUserMessage ? "text-right" : "text-left"
          )}>
          {formatTimestamp(message.timestamp)}
        </p>
      </div>
      {isCurrentUserMessage && (
         <Avatar className="h-8 w-8 shrink-0 border border-primary/30 shadow-md">
          {currentUser.pfpUrl ? (
            <AvatarImage src={currentUser.pfpUrl} alt={currentUser.nickname || currentUser.username} />
          ) : (
            <AvatarFallback className="bg-primary text-primary-foreground">
              <User size={18} />
            </AvatarFallback>
          )}
        </Avatar>
      )}
    </div>
  );
}
