
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
  isAiGenerationStopped: boolean; 
}

export default function MessageList({ messages, isLoading, isSpeechOutputEnabled, isAiGenerationStopped }: MessageListProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollContainer = contentRef.current;
    if (!scrollContainer) return;

    const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
      const lastMessageElement = scrollContainer.lastElementChild;
      if (lastMessageElement) {
        if (lastMessageElement instanceof HTMLElement) {
            lastMessageElement.scrollIntoView({ behavior, block: 'end' });
        }
      }
    };

    const initialScrollTimer = setTimeout(() => {
      scrollToBottom('smooth');
    }, 100);

    const lastMessage = messages[messages.length - 1];
    let observer: MutationObserver | undefined;

    if (
      lastMessage &&
      lastMessage.role === 'model' &&
      !lastMessage.imageUrl &&
      !lastMessage.isGeneratingImage &&
      !lastMessage.attachment &&
      !isLoading // Observe only if not in general loading (AI is thinking for new msg)
    ) {
      const lastMessageElement = scrollContainer.lastElementChild;
      if (lastMessageElement instanceof HTMLElement) { 
        observer = new MutationObserver(() => {
          // Scroll 'auto' for fast updates during typing, but only if not stopped
          if (!isAiGenerationStopped) { // Check prop here
            scrollToBottom('auto'); 
          }
        });

        observer.observe(lastMessageElement, {
          childList: true, 
          subtree: true,   
          characterData: true, 
        });
      }
    } else if (isLoading || (lastMessage && lastMessage.role === 'user')) {
      // If AI is thinking for a *new* message, or user just sent, scroll smoothly
      scrollToBottom('smooth');
    }


    return () => {
      clearTimeout(initialScrollTimer);
      if (observer) {
        observer.disconnect();
      }
    };
  }, [messages, isLoading, isAiGenerationStopped]); // Added isAiGenerationStopped to dependencies

  return (
    <ScrollArea className="flex-grow h-[calc(100vh-200px)]" ref={scrollAreaRef}>
      <div className="p-4 space-y-4" ref={contentRef}>
        {messages.map((msg) => (
          <MessageItem 
            key={msg.id} 
            message={msg} 
            isSpeechOutputEnabled={isSpeechOutputEnabled} 
            isGenerationStopped={isAiGenerationStopped} // Pass the prop here
          />
        ))}
        {/* Show "Harium AI is thinking..." only when:
            - isLoading is true (meaning a new response is being fetched)
            - There are messages in the history
            - The last message was from the user (AI is responding to this user message)
            - AI generation has not been stopped by the user
        */}
        {isLoading && messages.length > 0 && messages[messages.length-1].role === 'user' && !isAiGenerationStopped && (
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
    
