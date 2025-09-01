
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
  onAiDisplayFinalized: (messageId: string) => void;
}

export default function MessageList({ messages, isLoading, isSpeechOutputEnabled, isAiGenerationStopped, onAiDisplayFinalized }: MessageListProps) {
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
      !isLoading 
    ) {
      const lastMessageElement = scrollContainer.lastElementChild;
      if (lastMessageElement instanceof HTMLElement) { 
        observer = new MutationObserver(() => {
          if (!isAiGenerationStopped) { 
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
      scrollToBottom('smooth');
    }


    return () => {
      clearTimeout(initialScrollTimer);
      if (observer) {
        observer.disconnect();
      }
    };
  }, [messages, isLoading, isAiGenerationStopped]);

  return (
    <ScrollArea className="flex-grow h-[calc(100vh-200px)]" ref={scrollAreaRef}>
      <div className="p-4 space-y-4" ref={contentRef}>
        {messages.map((msg) => (
          <MessageItem 
            key={msg.id} 
            message={msg} 
            isSpeechOutputEnabled={isSpeechOutputEnabled} 
            isGenerationStopped={isAiGenerationStopped}
            onAiDisplayFinalized={onAiDisplayFinalized}
          />
        ))}
        {isLoading && messages.length > 0 && messages[messages.length-1].role === 'user' && !isAiGenerationStopped && (
          <div className="flex justify-start animate-message-in">
             <div className="flex items-center gap-2 p-3 rounded-lg bg-card/70 backdrop-blur-sm text-card-foreground border border-border/40 max-w-[70%]">
              <Bot size={18} className="text-primary-gradient animate-pulse"/>
              <span className="text-sm">ChohanGenAI is thinking...</span>
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
