
'use client';

import { useState } from 'react';
// import LiveMessageList from './LiveMessageList'; // Temporarily comment out
// import LiveMessageInput from './LiveMessageInput'; // Temporarily comment out
import { useAuth, type UserProfile } from '@/context/AuthContext';
// import { useToast } from '@/hooks/use-toast'; // Temporarily comment out
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
// import { manageConversationContext, type ManageConversationContextInput, type ManageConversationContextOutput } from '@/ai/flows/manage-conversation-context'; // Temporarily comment out

export interface LiveMessage {
  id: string;
  sender: UserProfile; 
  content: string;
  timestamp: number;
  isThinking?: boolean; 
}

// const MAX_MESSAGES_DISPLAY = 50; 
// const HARIUM_AI_USERNAME = 'HariumAI_Assistant';
// const HARIUM_AI_NICKNAME = 'Harium AI';
// const HARIUM_AI_MENTION = '@hariumai';

// const hariumAiProfile: UserProfile = {
//   username: HARIUM_AI_USERNAME,
//   nickname: HARIUM_AI_NICKNAME,
//   pfpUrl: '', 
// };


export default function LiveChatInterface() {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<LiveMessage[]>([
    {
      id: 'system-welcome-basic-simplified',
      sender: { username: 'System', nickname: 'System' },
      content: `Welcome to Simplified Live Chat! This is a test version.`,
      timestamp: Date.now(),
    }
  ]);
  // const [isSending, setIsSending] = useState(false);
  const { currentUser } = useAuth();
  // const { toast } = useToast();
  const router = useRouter();


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const content = inputValue.trim();

    if (!content || !currentUser) return;

    // setIsSending(true); // Temporarily removed

    const userMessage: LiveMessage = {
      id: `msg-user-${Date.now()}`,
      sender: currentUser,
      content,
      timestamp: Date.now(),
    };
    
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInputValue('');
    
    // AI Mention logic temporarily removed
    // setIsSending(false); // Temporarily removed
  };
  
  const handleGoBack = () => {
    router.push('/'); 
  };

  if (!currentUser) { // Extra check for currentUser
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
          <h1 className="text-xl md:text-2xl font-headline font-semibold text-primary">
            Live Group Chat (Test)
          </h1>
        </div>
        {currentUser && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:inline">As: {currentUser.nickname || currentUser.username}</span>
          </div>
        )}
      </header>
      <main className="flex-grow flex flex-col overflow-hidden p-4 space-y-2">
        {/* Inline Message List - Super Simplified */}
        <div className="flex-grow overflow-y-auto border border-border/30 p-2 rounded-md">
          {messages.map(msg => (
            <div key={msg.id} className="mb-1 p-1 rounded text-sm">
              <span className="font-semibold">{msg.sender.nickname || msg.sender.username}: </span>
              <span>{msg.content}</span>
            </div>
          ))}
        </div>
        
        {/* Inline Message Input - Super Simplified */}
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-3 p-2 border-t border-border/50 bg-card/50"
        >
          <input
            type="text"
            placeholder="Type a message..."
            value={inputValue}
            onChange={handleInputChange}
            // disabled={isSending} // Temporarily removed
            className="flex-grow p-2 border border-input rounded-md bg-background text-sm"
            aria-label="Message input"
            autoComplete="off"
          />
          <Button type="submit" /*disabled={isSending || !inputValue.trim()}*/ aria-label="Send message" size="sm">
            Send
            {/* {isSending ? (
              <Loader2 size={16} className="animate-spin ml-2" />
            ) : (
              <Send size={16} className="ml-2" />
            )} */}
          </Button>
        </form>
      </main>
    </div>
  );
}
