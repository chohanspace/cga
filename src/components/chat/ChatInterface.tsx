
'use client';

import { useState, useEffect, useCallback } from 'react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { manageConversationContext, type ManageConversationContextInput, type ManageConversationContextOutput } from '@/ai/flows/manage-conversation-context';
import { generateImageFromPrompt, type GenerateImageFromPromptInput, type GenerateImageFromPromptOutput } from '@/ai/flows/generate-image-from-prompt';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, Image as ImageIcon } from 'lucide-react';
import ModelSelector from './ModelSelector';

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  imageUrl?: string; // For AI-generated images
  attachment?: { // For user-uploaded images
    url: string; // data URI for display
    name: string;
  };
  isGeneratingImage?: boolean; // To show "Generating image..."
}

const AVAILABLE_MODELS = ['ad-1.1', 'ad-1.2', 'ad-1.3'];
const GENERATE_IMAGE_COMMAND = '[GENERATE_IMAGE:';

export default function ChatInterface() {
  const [inputValue, setInputValue] = useState('');
  const [conversationHistory, setConversationHistory] = useState<Message[]>([]);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>(AVAILABLE_MODELS[0]);
  const [attachedFile, setAttachedFile] = useState<{ name: string; dataUri: string; previewUrl: string } | null>(null);
  const { toast } = useToast();
  const { currentUser, logout } = useAuth();

  useEffect(() => {
    if (currentUser?.username && conversationHistory.length === 0) { // Only set initial if history is empty
        setConversationHistory([
        {
            id: 'welcome-message-initial',
            role: 'model',
            content: `Hello ${currentUser.username}! I am Harium AI, your friendly assistant using model ${selectedModel}. How can I help you today? ✨ You can also ask me to generate images!`,
        },
        ]);
    }
  }, [currentUser, selectedModel, conversationHistory.length]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileAttach = async (file: File) => {
    if (file && file.type.startsWith('image/')) {
      try {
        const dataUri = await fileToDataUri(file);
        setAttachedFile({ name: file.name, dataUri, previewUrl: URL.createObjectURL(file) });
      } catch (error) {
        console.error("Error converting file to Data URI:", error);
        toast({
          variant: 'destructive',
          title: 'File Error',
          description: 'Could not process the attached file.',
        });
      }
    } else {
      toast({
        variant: 'destructive',
        title: 'Invalid File',
        description: 'Please attach an image file.',
      });
    }
  };

  const handleClearAttachment = () => {
    if (attachedFile) {
      URL.revokeObjectURL(attachedFile.previewUrl); // Clean up object URL
    }
    setAttachedFile(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const currentUserInput = inputValue.trim();

    if ((!currentUserInput && !attachedFile) || isLoadingAI) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: currentUserInput,
      ...(attachedFile ? { attachment: { url: attachedFile.previewUrl, name: attachedFile.name } } : {}),
    };

    const historyForAI = conversationHistory
      .filter(msg => msg.id !== 'welcome-message-initial' && msg.id !== 'welcome-message-cleared')
      .map(msg => ({ 
        role: msg.role, 
        content: msg.content,
        // Pass attachment info if AI needs it in context (though current prompt doesn't use this from history)
        // attachmentDataUri: msg.role === 'user' && msg.attachment ? "Image was attached" : undefined 
      }));

    setConversationHistory(prev => [...prev, userMessage]);
    setInputValue('');
    const currentAttachmentDataUri = attachedFile?.dataUri;
    handleClearAttachment(); // Clear attachment from input area after adding to message
    setIsLoadingAI(true);

    try {
      const aiInput: ManageConversationContextInput = {
        userInput: currentUserInput,
        conversationHistory: historyForAI,
        attachmentDataUri: currentAttachmentDataUri,
      };
      
      const result: ManageConversationContextOutput = await manageConversationContext(aiInput);
      
      if (result.response.startsWith(GENERATE_IMAGE_COMMAND)) {
        const imagePrompt = result.response.substring(GENERATE_IMAGE_COMMAND.length, result.response.length - 1).trim();
        const generatingMessageId = `model-generating-${Date.now()}`;
        const generatingMessage: Message = {
          id: generatingMessageId,
          role: 'model',
          content: `Generating an image of: "${imagePrompt}"...`,
          isGeneratingImage: true,
        };
        setConversationHistory(prev => [...prev, generatingMessage]);

        try {
          const imageResult: GenerateImageFromPromptOutput = await generateImageFromPrompt({ prompt: imagePrompt });
          const imageMessage: Message = {
            id: `model-image-${Date.now()}`,
            role: 'model',
            content: `Here's an image of "${imagePrompt}":`,
            imageUrl: imageResult.imageUrl,
          };
          // Replace generating message with the actual image message
          setConversationHistory(prev => prev.map(msg => msg.id === generatingMessageId ? imageMessage : msg));

        } catch (imageError) {
          console.error('Error generating image:', imageError);
          const errorMsg: Message = {
            id: `model-error-${Date.now()}`,
            role: 'model',
            content: "Sorry, I couldn't generate the image. Please try again.",
          };
          setConversationHistory(prev => prev.map(msg => msg.id === generatingMessageId ? errorMsg : msg));
          toast({
            variant: 'destructive',
            title: 'Image Generation Failed',
            description: 'Could not generate the image. The model might be unavailable or the prompt too complex.',
          });
        }

      } else {
        const aiMessage: Message = {
          id: `model-${Date.now()}`,
          role: 'model',
          content: result.response,
        };
        setConversationHistory(prev => [...prev, aiMessage]);
      }

    } catch (error) {
      console.error('Error calling AI:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to get response from Harium AI. Please check your configuration and try again.',
      });
       const aiMessage: Message = {
        id: `model-error-${Date.now()}`,
        role: 'model',
        content: "I encountered an error. Please try again.",
      };
      setConversationHistory(prev => [...prev, aiMessage]);
    } finally {
      setIsLoadingAI(false);
    }
  };

  const handleClearContext = () => {
    setConversationHistory([
      {
        id: 'welcome-message-cleared',
        role: 'model',
        content: `Context cleared. I am now using model ${selectedModel}. How can I help you now? ✨`,
      },
    ]);
    handleClearAttachment();
    toast({
        title: 'Context Cleared',
        description: 'The conversation history has been reset.',
    });
  };

  const handleModelChange = (model: string) => {
    setSelectedModel(model);
    setConversationHistory(prev => [
        ...prev.filter(msg => msg.id !== 'welcome-message-initial' && msg.id !== 'welcome-message-cleared'),
         {
            id: `model-change-${Date.now()}`,
            role: 'model',
            content: `Switched to model **${model}**. How can I assist you?`
        }
    ]);
    toast({
        title: 'Model Changed',
        description: `Now using model ${model}.`,
    });
  };

  return (
    <div className="flex flex-col h-screen bg-transparent shadow-xl rounded-lg overflow-hidden m-2 md:m-4 lg:mx-auto lg:max-w-4xl border border-border/30">
      <header className="p-4 border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-10 shadow-md flex justify-between items-center">
        <div className="flex items-center gap-2">
          <ModelSelector
            currentModel={selectedModel}
            onModelChange={handleModelChange}
            availableModels={AVAILABLE_MODELS}
          />
          <h1 className="text-xl md:text-2xl font-headline font-semibold text-primary">
            Harium AI 
            <span className="text-sm md:text-base font-normal text-muted-foreground ml-1">({selectedModel})</span>
          </h1>
        </div>
        {currentUser && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:inline">Logged in as: {currentUser.username}</span>
            <Button variant="ghost" size="icon" onClick={logout} aria-label="Logout">
              <LogOut size={20} />
            </Button>
          </div>
        )}
      </header>
      <main className="flex-grow flex flex-col overflow-hidden">
        <MessageList messages={conversationHistory} isLoading={isLoadingAI} />
        <MessageInput
          inputValue={inputValue}
          onInputChange={handleInputChange}
          onSubmit={handleSubmit}
          onClearContext={handleClearContext}
          isLoading={isLoadingAI}
          canClearContext={conversationHistory.filter(msg => msg.id !== 'welcome-message-cleared' && msg.id !== 'welcome-message-initial').length > 0}
          onFileAttach={handleFileAttach}
          attachedFile={attachedFile ? { name: attachedFile.name, previewUrl: attachedFile.previewUrl } : null}
          onClearAttachment={handleClearAttachment}
        />
      </main>
    </div>
  );
}
