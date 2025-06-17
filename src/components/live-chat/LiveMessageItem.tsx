
'use client';

import type { LiveMessage } from './LiveChatInterface';
import type { UserProfile } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { User, BotMessageSquare } from 'lucide-react'; // Using BotMessageSquare for system messages

interface LiveMessageItemProps {
  message: LiveMessage;
  currentUser: UserProfile;
}

export default function LiveMessageItem({ message, currentUser }: LiveMessageItemProps) {
  const isCurrentUser = message.sender.username === currentUser.username;
  const isSystemMessage = message.sender.username === 'System';

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
        isCurrentUser ? 'justify-end' : 'justify-start'
      )}
    >
      {!isCurrentUser && (
        <Avatar className="h-8 w-8 shrink-0 border border-border/50 shadow-md">
          {message.sender.pfpUrl ? (
            <AvatarImage src={message.sender.pfpUrl} alt={message.sender.nickname || message.sender.username} />
          ) : (
            <AvatarFallback className="bg-secondary text-secondary-foreground">
              <User size={18} />
            </AvatarFallback>
          )}
        </Avatar>
      )}
      <div
        className={cn(
          'relative max-w-[70%] p-3 shadow-lg text-sm flex flex-col gap-0.5',
          isCurrentUser
            ? 'bg-primary/70 backdrop-blur-sm text-primary-foreground rounded-lg rounded-br-sm border border-primary/40'
            : 'bg-card/70 backdrop-blur-sm text-card-foreground rounded-lg rounded-bl-sm border border-border/40'
        )}
      >
        {!isCurrentUser && (
          <p className="text-xs font-semibold text-accent mb-0.5">
            {message.sender.nickname || message.sender.username}
          </p>
        )}
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        <p className={cn(
            "text-xs opacity-70 mt-1",
            isCurrentUser ? "text-right" : "text-left"
          )}>
          {formatTimestamp(message.timestamp)}
        </p>
      </div>
      {isCurrentUser && (
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
