
'use client';

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
    const scrollContainer = contentRef.current;
    if (!scrollContainer) return;

    const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
      const lastMessageElement = scrollContainer.lastElementChild;
      if (lastMessageElement) {
        // Ensure the element is a proper HTMLElement for scrollIntoView
        if (lastMessageElement instanceof HTMLElement) {
            lastMessageElement.scrollIntoView({ behavior, block: 'end' });
        }
      }
    };

    // Initial scroll when messages or isLoading changes (e.g., new message bubble added)
    const initialScrollTimer = setTimeout(() => {
      scrollToBottom('smooth');
    }, 100);

    // Setup MutationObserver for continuous scrolling during AI typing
    const lastMessage = messages[messages.length - 1];
    let observer: MutationObserver | undefined;

    if (
      lastMessage &&
      lastMessage.role === 'model' &&
      !lastMessage.imageUrl &&
      !lastMessage.isGeneratingImage &&
      !lastMessage.attachment &&
      !isLoading // Only observe if AI is actively typing (not in general loading state)
    ) {
      const lastMessageElement = scrollContainer.lastElementChild;
      if (lastMessageElement instanceof HTMLElement) { // Check if it's an HTMLElement
        observer = new MutationObserver(() => {
          scrollToBottom('auto'); // Use 'auto' for instant scroll to keep up with typing
        });

        observer.observe(lastMessageElement, {
          childList: true, // For changes in direct children (e.g. if structure changes)
          subtree: true,   // For changes deeper in the DOM tree (e.g. text nodes)
          characterData: true, // Specifically for text content changes
        });
      }
    }

    return () => {
      clearTimeout(initialScrollTimer);
      if (observer) {
        observer.disconnect();
      }
    };
  }, [messages, isLoading]); // Re-run effect if messages array or isLoading state changes

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
