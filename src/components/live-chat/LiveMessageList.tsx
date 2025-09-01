
'use client';

import type { LiveMessage } from './LiveChatInterface';
import type { UserProfile } from '@/context/AuthContext';
import LiveMessageItem from './LiveMessageItem';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEffect, useRef } from 'react';

interface LiveMessageListProps {
  messages: LiveMessage[];
  currentUser: UserProfile | null;
}

export default function LiveMessageList({ messages, currentUser }: LiveMessageListProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timerId = setTimeout(() => {
      if (contentRef.current?.lastElementChild) {
        contentRef.current.lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    }, 100); // Defer to next tick to ensure DOM is updated

    return () => clearTimeout(timerId);
  }, [messages]);

  if (!currentUser) {
    return (
      <div className="flex-grow flex items-center justify-center">
        <p className="text-muted-foreground">Loading messages...</p>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-grow h-[calc(100vh-200px)]" ref={scrollAreaRef}>
      <div className="p-4 space-y-4" ref={contentRef}>
        {messages.map((msg) => (
          <LiveMessageItem key={msg.id} message={msg} currentUser={currentUser} />
        ))}
      </div>
    </ScrollArea>
  );
}
