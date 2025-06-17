
'use client';

import { useState, useEffect, useCallback } from 'react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { manageConversationContext, type ManageConversationContextInput, type ManageConversationContextOutput } from '@/ai/flows/manage-conversation-context';
import { generateImageFromPrompt, type GenerateImageFromPromptInput, type GenerateImageFromPromptOutput } from '@/ai/flows/generate-image-from-prompt';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import ChatMenu from './ChatMenu';
import EditProfileDialog from './EditProfileDialog';
import Image from 'next/image';

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  imageUrl?: string;
  attachment?: {
    url: string;
    name: string;
  };
  isGeneratingImage?: boolean;
}

const AVAILABLE_MODELS = ['ha-1.1', 'ha-1.2', 'ha-1.3', 'ha-1.4'];
const DEFAULT_MODEL = 'ha-1.4';
const GENERATE_IMAGE_COMMAND = '[GENERATE_IMAGE:';

const samplePrompts: string[] = [
  "Explain quantum computing in simple terms.",
  "Generate an image of a serene cyberpunk city at night.",
  "Write a short story about a friendly robot.",
  "What are the latest advancements in AI?",
  "Suggest three healthy breakfast ideas.",
  "Create a futuristic UI concept for a music app.",
  "Tell me a fun fact about space.",
];


export default function ChatInterface() {
  const [inputValue, setInputValue] = useState('');
  const [conversationHistory, setConversationHistory] = useState<Message[]>([]);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_MODEL);
  const [attachedFile, setAttachedFile] = useState<{ name: string; dataUri: string; previewUrl: string } | null>(null);
  const { toast } = useToast();
  const { currentUser, logout } = useAuth();
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isSpeechOutputEnabled, setIsSpeechOutputEnabled] = useState(false);

  useEffect(() => {
    if (currentUser && conversationHistory.length === 0) {
        const displayName = currentUser.nickname || currentUser.username;
        setConversationHistory([
        {
            id: 'welcome-message-initial',
            role: 'model',
            content: `Hello ${displayName}! I am Harium AI, your friendly assistant using model ${selectedModel}. How can I help you today? ✨ You can also ask me to generate images!`,
        },
        ]);
    }
  }, [currentUser, selectedModel, conversationHistory.length]);
  
  const handlePromptSuggestionClick = (promptText: string) => {
    setInputValue(promptText);
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
      URL.revokeObjectURL(attachedFile.previewUrl);
    }
    setAttachedFile(null);
  };

  const handleSubmit = async (currentInputText: string) => {
    const finalInput = currentInputText.trim();

    if ((!finalInput && !attachedFile) || isLoadingAI) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: finalInput,
      ...(attachedFile ? { attachment: { url: attachedFile.previewUrl, name: attachedFile.name } } : {}),
    };

    const historyForAI = conversationHistory
      .filter(msg => msg.id !== 'welcome-message-initial' && msg.id !== 'welcome-message-cleared')
      .map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

    setConversationHistory(prev => [...prev, userMessage]);
    setInputValue(''); 
    const currentAttachmentDataUri = attachedFile?.dataUri;
    handleClearAttachment(); 
    setIsLoadingAI(true);

    try {
      const aiInput: ManageConversationContextInput = {
        userInput: finalInput,
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
    if (window.speechSynthesis && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
    }
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

  const toggleSpeechOutput = () => {
    setIsSpeechOutputEnabled(prev => {
        if (prev && window.speechSynthesis && window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel(); // Cancel speech if turning off
        }
        return !prev;
    });
  };
  
  useEffect(() => {
    return () => {
        if (window.speechSynthesis && window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
        }
    }
  }, []);


  return (
    <div className="flex flex-col h-screen bg-transparent shadow-2xl rounded-lg overflow-hidden lg:mx-auto lg:max-w-4xl border border-border/30">
      <header className="p-4 border-b border-border/50 bg-card/70 backdrop-blur-md sticky top-0 z-10 shadow-md flex justify-between items-center">
        <div className="flex items-center gap-2">
          {currentUser && (
            <ChatMenu
              currentModel={selectedModel}
              onModelChange={handleModelChange}
              availableModels={AVAILABLE_MODELS}
              onClearContext={handleClearContext}
              onLogout={logout}
              onOpenEditProfile={() => setIsEditProfileOpen(true)}
              isSpeechOutputEnabled={isSpeechOutputEnabled}
              onToggleSpeechOutput={toggleSpeechOutput}
            />
          )}
          <div className="flex items-center">
            <Image 
              src="/harium-logo.svg" 
              alt="Harium AI Logo" 
              width={36} 
              height={36} 
              className="h-9 w-9"
              priority
            />
            <span className="text-xs md:text-sm font-normal text-muted-foreground/80 ml-2">({selectedModel})</span>
          </div>
        </div>
        {currentUser && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:inline">Logged in as: {currentUser.nickname || currentUser.username}</span>
          </div>
        )}
      </header>
      <main className="flex-grow flex flex-col overflow-hidden">
        <MessageList messages={conversationHistory} isLoading={isLoadingAI} isSpeechOutputEnabled={isSpeechOutputEnabled} />
        <MessageInput
          inputValue={inputValue}
          setInputValue={setInputValue}
          onSubmit={handleSubmit}
          onClearContext={handleClearContext}
          isLoading={isLoadingAI}
          canClearContext={conversationHistory.filter(msg => msg.id !== 'welcome-message-cleared' && msg.id !== 'welcome-message-initial').length > 0}
          onFileAttach={handleFileAttach}
          attachedFile={attachedFile ? { name: attachedFile.name, previewUrl: attachedFile.previewUrl } : null}
          onClearAttachment={handleClearAttachment}
          samplePrompts={samplePrompts}
          onPromptSuggestionClick={handlePromptSuggestionClick}
        />
      </main>
      {currentUser && (
        <EditProfileDialog
          isOpen={isEditProfileOpen}
          onOpenChange={setIsEditProfileOpen}
          user={currentUser}
        />
      )}
    </div>
  );
}
