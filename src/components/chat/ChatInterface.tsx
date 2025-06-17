
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  "How does photosynthesis work?",
  "Generate an image of a majestic dragon flying over mountains.",
  "Compose a short poem about autumn.",
  "What are the benefits of meditation?",
  "List five popular travel destinations in Europe.",
  "Design a logo for a coffee shop called 'The Daily Grind'.",
  "Explain the theory of relativity for a beginner.",
  "Generate an image of a whimsical forest creature.",
  "Write a dialogue between a cat and a dog.",
  "What is blockchain technology?",
  "Give me some tips for learning a new language.",
  "Create a color palette for a calming website.",
  "Tell me about the history of the internet.",
  "Generate an image of an underwater city.",
  "Write a recipe for a simple chocolate cake.",
  "What are common causes of stress?",
  "Suggest some indoor hobbies.",
  "Design a character for a fantasy game.",
  "Explain dark matter.",
  "Generate an image of a futuristic vehicle.",
  "Write a haiku about the ocean.",
  "What are good exercises for posture?",
  "List some famous unsolved mysteries.",
  "Create an abstract background image.",
  "Tell me about the Roman Empire.",
  "Generate an image of a surreal landscape.",
  "Write a song verse about hope.",
  "What is the difference between nuclear fission and fusion?",
  "Suggest some productivity hacks.",
  "Design an icon for a weather app.",
  "Explain the concept of a black hole.",
  "Generate an image of a cute alien pet.",
  "Write a thank-you note to a friend.",
  "What are the main types of renewable energy?",
  "Give me ideas for a weekend project.",
  "Create a simple animation of a bouncing ball (describe frames).",
  "Tell me about the Great Wall of China.",
  "Generate an image of a retro-style robot.",
  "Write a short biography of Marie Curie.",
  "What are the symptoms of the common cold?",
  "Suggest some books for a sci-fi fan.",
  "Design a user interface for a fitness tracker.",
  "Explain the butterfly effect.",
  "Generate an image of a mystical sword.",
  "Write a story opening for a mystery novel.",
  "What are the primary colors?",
  "What are some effective study techniques?",
  "Create a pattern for a fabric design.",
  "Tell me about ancient Egypt.",
  "Generate an image of a neon-lit alleyway.",
  "Write a short monologue for a character.",
  "How does a car engine work?",
  "Suggest gift ideas for a nature lover.",
  "Design a poster for a music festival.",
  "Explain the significance of the Mona Lisa.",
  "Generate an image of a steampunk airship.",
  "Write a limerick about a clumsy chef.",
  "What are the benefits of drinking water?",
  "List some famous inventors and their inventions.",
  "Create a 3D model of a simple house (describe).",
  "Tell me about the Amazon rainforest.",
  "Generate an image of a magical potion bottle.",
  "Write a scene for a play set in a cafe.",
  "What is artificial intelligence ethics?",
  "Suggest some healthy snack options.",
  "Design a mobile app screen for a to-do list.",
  "Explain the concept of gravity.",
  "Generate an image of a futuristic cityscape at sunset.",
  "Write a short fable with a moral.",
  "What are different types of clouds?",
  "Give me some tips for public speaking.",
  "Create a business card design for a photographer.",
  "Tell me about the Renaissance period.",
  "Generate an image of a talking tree.",
  "Write a plot summary for a comedy movie.",
  "How does Wi-Fi work?",
  "Suggest some team-building activities.",
  "Design a webpage layout for a blog.",
  "Explain the importance of biodiversity.",
  "Generate an image of a crystal cave.",
  "Write a character sketch of a detective.",
  "What are the planets in our solar system?",
  "What are some ways to save money?",
  "Create an emoji for 'curiosity'.",
  "Tell me about the discovery of penicillin.",
  "Generate an image of a robot chef.",
  "Write a short horror story.",
  "What is the pH scale?",
  "Suggest some good podcasts to listen to.",
  "Design an app icon for a language learning app.",
  "Explain the process of evolution.",
  "Generate an image of a griffin.",
  "Write a mission statement for a non-profit.",
  "How do vaccines work?",
  "What are some common programming languages?",
  "Create a mood board for a rustic wedding.",
  "Tell me about Shakespeare.",
  "Generate an image of a desert oasis.",
  "Write a funny anecdote.",
  "What is the difference between weather and climate?",
  "Suggest some tips for better sleep.",
  "Design a book cover for a fantasy novel.",
  "Explain the concept of supply and demand.",
  "Generate an image of a friendly ghost.",
  "Write a jingle for a new cereal.",
  "What are the wonders of the ancient world?",
  "How can I improve my writing skills?",
  "Create an infographic about recycling.",
  "Tell me about the Industrial Revolution.",
  "Generate an image of a time machine.",
  "Write a cliffhanger for a story.",
  "What are the different layers of the Earth?",
  "Suggest some vegetarian recipes.",
  "Design a user flow for an e-commerce checkout.",
  "Explain the significance of the Rosetta Stone.",
  "Generate an image of a bioluminescent mushroom.",
  "Write a set of instructions for a simple game.",
  "What is quantum entanglement?",
  "What are good questions to ask in an interview?",
  "Create a presentation slide about teamwork.",
  "Tell me about the Vikings.",
  "Generate an image of a portal to another dimension.",
  "Write a short script for an animated short.",
  "How does the stock market work?",
  "Suggest some eco-friendly habits.",
  "Design a logo for a tech startup.",
  "Explain the concept of déjà vu.",
  "Generate an image of a phoenix rising from ashes.",
  "Write a persuasive argument about a social issue.",
  "What are the stages of a butterfly's life cycle?",
  "How to make a good first impression?",
  "Create a wireframe for a mobile banking app.",
  "Tell me about the mythology of ancient Greece.",
  "Generate an image of a spaceship landing on Mars.",
  "Write a travel blog post about a fictional city.",
  "What is the Doppler effect?",
  "Suggest ways to reduce plastic waste.",
  "Design a character sheet for a tabletop RPG.",
  "Explain the importance of critical thinking.",
  "Generate an image of an enchanted library.",
  "Write a breakup letter (from a funny perspective).",
  "What are common logical fallacies?",
  "How to plan a successful event?",
  "Create a storyboard for a commercial.",
  "Tell me about the Aztecs.",
  "Generate an image of a cybernetic animal.",
  "Write a list of 10 things to do on a rainy day.",
  "What is game theory?",
  "Suggest some tips for negotiating a salary.",
  "Design a T-shirt graphic.",
  "Explain the concept of mindfulness.",
  "Generate an image of a castle in the clouds."
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
  const [isAiGenerationStopped, setIsAiGenerationStopped] = useState(false);
  const isAiGenerationStoppedRef = useRef(isAiGenerationStopped);

  useEffect(() => {
    isAiGenerationStoppedRef.current = isAiGenerationStopped;
  }, [isAiGenerationStopped]);

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

  const handleStopAiGeneration = useCallback(() => {
    setIsAiGenerationStopped(true);
    isAiGenerationStoppedRef.current = true;
    setIsLoadingAI(false); // Immediately set loading to false
    if (window.speechSynthesis && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    toast({
      title: 'AI Generation Stopped',
      description: 'The AI response has been halted.',
    });
  }, [toast]);

  const handleAiDisplayFinalized = useCallback((finalizedMessageId: string) => {
    setConversationHistory(prevHistory => {
        if (prevHistory.length > 0 && 
            prevHistory[prevHistory.length - 1].id === finalizedMessageId &&
            !isAiGenerationStoppedRef.current) {
            setIsLoadingAI(false);
        }
        return prevHistory;
    });
  }, []); // No direct dependency on isLoadingAI to avoid loops, relies on isAiGenerationStoppedRef

  const handleSubmit = async (currentInputText: string) => {
    const finalInput = currentInputText.trim();

    if ((!finalInput && !attachedFile) || isLoadingAI) return;

    setIsLoadingAI(true);
    setIsAiGenerationStopped(false); 
    isAiGenerationStoppedRef.current = false;

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

    try {
      const aiInput: ManageConversationContextInput = {
        userInput: finalInput,
        conversationHistory: historyForAI,
        attachmentDataUri: currentAttachmentDataUri,
      };
      
      // Short delay to allow stop signal to register if clicked immediately
      await new Promise(resolve => setTimeout(resolve, 50)); 
      if (isAiGenerationStoppedRef.current) { return; } // Stop button already handled isLoadingAI

      const result: ManageConversationContextOutput = await manageConversationContext(aiInput);
      
      if (isAiGenerationStoppedRef.current) { return; } // Stop button already handled isLoadingAI

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
          if (isAiGenerationStoppedRef.current) { return; }
          const imageResult: GenerateImageFromPromptOutput = await generateImageFromPrompt({ prompt: imagePrompt });
          if (isAiGenerationStoppedRef.current) { return; }

          const imageMessage: Message = {
            id: `model-image-${Date.now()}`,
            role: 'model',
            content: `Here's an image of "${imagePrompt}":`,
            imageUrl: imageResult.imageUrl,
          };
          setConversationHistory(prev => prev.map(msg => msg.id === generatingMessageId ? imageMessage : msg));
        } catch (imageError) {
          console.error('Error generating image:', imageError);
          if (isAiGenerationStoppedRef.current) { return; }
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
        } finally {
          // This 'finally' is specific to the image generation try-catch
          if (!isAiGenerationStoppedRef.current) {
            setIsLoadingAI(false); // Image generation is complete (success or fail)
          }
        }
      } else {
        // Text-only response. isLoadingAI remains true.
        // MessageItem will call handleAiDisplayFinalized when typing is done or stopped.
        const aiMessage: Message = {
          id: `model-${Date.now()}`,
          role: 'model',
          content: result.response,
        };
        setConversationHistory(prev => [...prev, aiMessage]);
      }

    } catch (error) {
      if (isAiGenerationStoppedRef.current) {
        console.log('AI processing was stopped, error likely due to interruption or already handled.');
      } else {
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
        setIsLoadingAI(false); // Set loading false on general error if not stopped
      }
    }
    // No general 'finally' here for setIsLoadingAI(false) - it's handled by specific paths or callbacks
  };

  const handleClearContext = () => {
    if (window.speechSynthesis && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
    }
    if (isLoadingAI) {
        handleStopAiGeneration(); // This will also set isLoadingAI to false
    }
    // Ensure states are reset even if not loading
    setIsAiGenerationStopped(false); 
    isAiGenerationStoppedRef.current = false;
    if (!isLoadingAI) setIsLoadingAI(false); // If it wasn't loading, ensure it's false

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
            window.speechSynthesis.cancel(); 
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
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-foreground rounded-full flex items-center justify-center shadow-md shrink-0">
              <span className="text-background text-lg font-bold animate-letter-scale-pulse">
                H
              </span>
            </div>
            <h1 className="font-black text-primary text-2xl md:text-3xl">
              Harium AI
            </h1>
            <span className="text-xs md:text-sm font-normal text-muted-foreground/80 self-center">({selectedModel})</span>
          </div>
        </div>
        {currentUser && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:inline">Logged in as: {currentUser.nickname || currentUser.username}</span>
          </div>
        )}
      </header>
      <main className="flex-grow flex flex-col overflow-hidden">
        <MessageList 
            messages={conversationHistory} 
            isLoading={isLoadingAI} 
            isSpeechOutputEnabled={isSpeechOutputEnabled}
            isAiGenerationStopped={isAiGenerationStopped}
            onAiDisplayFinalized={handleAiDisplayFinalized}
        />
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
          onStopAiGeneration={handleStopAiGeneration}
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
    
