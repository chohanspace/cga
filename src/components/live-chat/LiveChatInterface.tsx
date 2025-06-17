
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAuth, type UserProfile } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, Bot, Send, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { manageConversationContext, type ManageConversationContextInput, type ManageConversationContextOutput } from '@/ai/flows/manage-conversation-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';


export interface LiveMessage {
  id: string;
  sender: Pick<UserProfile, 'username' | 'nickname' | 'pfpUrl'>; // Only store necessary sender info
  content: string;
  timestamp: number;
  isThinking?: boolean;
}

const HARIUM_AI_USERNAME = 'HariumAI_Assistant';
const HARIUM_AI_NICKNAME = 'Harium AI';
const HARIUM_AI_MENTION_TRIGGER = '@hariumai';

const hariumAiProfile: Pick<UserProfile, 'username' | 'nickname' | 'pfpUrl'> = {
  username: HARIUM_AI_USERNAME,
  nickname: HARIUM_AI_NICKNAME,
  pfpUrl: '', // No PFP for Harium AI for now
};

const SystemProfile: Pick<UserProfile, 'username' | 'nickname' | 'pfpUrl'> = {
    username: 'System',
    nickname: 'System',
    pfpUrl: '',
};

// Simplified Inline LiveMessageItem
const LiveMessageItemSimplified = ({ message, currentUsername }: { message: LiveMessage; currentUsername: string }) => {
  const isCurrentUserMessage = message.sender.username === currentUsername;
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
        'flex items-end gap-2.5 animate-message-in mb-3',
        isCurrentUserMessage ? 'justify-end' : 'justify-start'
      )}
    >
      {!isCurrentUserMessage && (
        <Avatar className="h-8 w-8 shrink-0 border border-border/50 shadow-md self-start">
          {message.sender.pfpUrl && !isHariumAiMessage ? (
            <AvatarImage src={message.sender.pfpUrl} alt={message.sender.nickname || message.sender.username} />
          ) : (
            <AvatarFallback className={cn(
              "bg-secondary text-secondary-foreground",
              isHariumAiMessage && "bg-accent text-accent-foreground"
            )}>
              {isHariumAiMessage ? <Bot size={18} /> : <Users size={18} />}
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
         <Avatar className="h-8 w-8 shrink-0 border border-primary/30 shadow-md self-start">
          {currentUser?.pfpUrl ? (
            <AvatarImage src={currentUser.pfpUrl} alt={currentUser.nickname || currentUser.username} />
          ) : (
            <AvatarFallback className="bg-primary text-primary-foreground">
              <Users size={18} />
            </AvatarFallback>
          )}
        </Avatar>
      )}
    </div>
  );
};


export default function LiveChatInterface() {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<LiveMessage[]>([
    {
      id: 'system-welcome-basic-simplified',
      sender: SystemProfile,
      content: `Welcome to Live Group Chat! Mention @hariumai to talk to the AI. Messages are local to your browser.`,
      timestamp: Date.now(),
    }
  ]);
  const [isSending, setIsSending] = useState(false);
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timerId = setTimeout(() => {
      if (contentRef.current?.lastElementChild) {
        contentRef.current.lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    }, 100);
    return () => clearTimeout(timerId);
  }, [messages]);

  const addMessageToList = useCallback((message: LiveMessage) => {
    setMessages(prevMessages => [...prevMessages, message]);
  }, []);

  const updateMessageInList = useCallback((messageId: string, updates: Partial<LiveMessage>) => {
    setMessages(prevMessages => 
      prevMessages.map(msg => msg.id === messageId ? { ...msg, ...updates } : msg)
    );
  }, []);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const content = inputValue.trim();

    if (!content || !currentUser) return;

    setIsSending(true);

    const userMessage: LiveMessage = {
      id: `msg-user-${Date.now()}`,
      sender: {
          username: currentUser.username,
          nickname: currentUser.nickname,
          pfpUrl: currentUser.pfpUrl
      },
      content,
      timestamp: Date.now(),
    };
    
    addMessageToList(userMessage);
    const originalInputValue = inputValue; // Keep original for AI
    setInputValue('');
    
    if (originalInputValue.toLowerCase().startsWith(HARIUM_AI_MENTION_TRIGGER)) {
      const aiPrompt = originalInputValue.substring(HARIUM_AI_MENTION_TRIGGER.length).trim();
      
      if (aiPrompt) {
        const thinkingMessageId = `msg-hariumai-thinking-${Date.now()}`;
        const thinkingMessage: LiveMessage = {
          id: thinkingMessageId,
          sender: hariumAiProfile,
          content: `Harium AI is thinking about "${aiPrompt.substring(0, 30)}${aiPrompt.length > 30 ? "..." : ""}"`,
          timestamp: Date.now(),
          isThinking: true,
        };
        addMessageToList(thinkingMessage);

        try {
          const historyForAI = messages
            .filter(msg => msg.id !== 'system-welcome-basic-simplified' && !msg.isThinking) // Exclude welcome and previous thinking
            .slice(-5) // Take last 5 messages for context
            .map(msg => ({
              role: msg.sender.username === currentUser.username ? 'user' as const : 'model' as const,
              content: `${msg.sender.nickname || msg.sender.username}: ${msg.content}`,
            }));


          const aiInput: ManageConversationContextInput = {
            userInput: `The user @${currentUser.nickname || currentUser.username} in a group chat says: ${aiPrompt}`,
             conversationHistory: historyForAI,
          };
          const result: ManageConversationContextOutput = await manageConversationContext(aiInput);
          
          const aiResponseMessage: LiveMessage = {
            id: `msg-hariumai-response-${Date.now()}`,
            sender: hariumAiProfile,
            content: result.response,
            timestamp: Date.now(),
          };
          updateMessageInList(thinkingMessageId, aiResponseMessage); // Replace thinking message

        } catch (error) {
          console.error("Error calling Harium AI:", error);
          toast({ variant: 'destructive', title: 'AI Error', description: 'Failed to get response from Harium AI.' });
          const errorMessage: LiveMessage = {
            id: `msg-hariumai-error-${Date.now()}`,
            sender: hariumAiProfile,
            content: "Sorry, I couldn't process that request.",
            timestamp: Date.now(),
          };
          updateMessageInList(thinkingMessageId, errorMessage);
        } finally {
           setIsSending(false);
        }
      } else {
        // @hariumai was mentioned but no prompt followed
        const noPromptMessage: LiveMessage = {
          id: `msg-hariumai-noprompt-${Date.now()}`,
          sender: hariumAiProfile,
          content: "You mentioned me! What can I help you with?",
          timestamp: Date.now(),
        };
        addMessageToList(noPromptMessage);
        setIsSending(false);
      }
    } else {
      setIsSending(false);
    }
  };
  
  const handleGoBack = () => {
    router.push('/'); 
  };

  if (!currentUser) { 
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <p>Loading user information or redirecting...</p>
        </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-transparent shadow-2xl rounded-lg overflow-hidden m-2 md:m-4 lg:mx-auto lg:max-w-4xl border border-border/30">
      <header className="p-4 border-b border-border/50 bg-card/70 backdrop-blur-md sticky top-0 z-10 shadow-md flex justify-between items-center">
        <div className="flex items-center gap-2">
           <Button variant="ghost" size="icon" onClick={handleGoBack} aria-label="Back to AI Chat">
            <ArrowLeft size={20} />
          </Button>
          <Users className="h-6 w-6 text-primary" />
          <h1 className="text-xl md:text-2xl font-black text-primary">
            Live Group Chat
          </h1>
        </div>
        {currentUser && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:inline">As: {currentUser.nickname || currentUser.username}</span>
          </div>
        )}
      </header>
      
      <ScrollArea className="flex-grow h-[calc(100vh-200px)]" ref={scrollAreaRef}>
        <div className="p-4 space-y-1" ref={contentRef}>
          {messages.map(msg => (
            <LiveMessageItemSimplified key={msg.id} message={msg} currentUsername={currentUser.username} />
          ))}
        </div>
      </ScrollArea>
        
      <div className="p-4 border-t border-border/50 bg-card/70 backdrop-blur-md shadow-lg">
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-3"
        >
          <Input
            type="text"
            placeholder="Type a message... (@hariumai for AI)"
            value={inputValue}
            onChange={handleInputChange}
            disabled={isSending}
            className="flex-grow"
            aria-label="Message input"
            autoComplete="off"
          />
          <Button type="submit" disabled={isSending || !inputValue.trim()} aria-label="Send message">
            {isSending ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Send size={20} />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

