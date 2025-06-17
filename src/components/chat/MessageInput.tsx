
'use client';

import type React from 'react';
import { useRef, useState, useEffect }  from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Trash2, Loader2, Paperclip, X, Mic, MicOff } from 'lucide-react';
import Image from 'next/image';
import PromptSuggestions from './PromptSuggestions';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';


interface MessageInputProps {
  inputValue: string;
  setInputValue: (value: string) => void;
  onSubmit: (inputText: string) => void;
  onClearContext: () => void;
  isLoading: boolean;
  canClearContext: boolean;
  onFileAttach: (file: File) => void;
  attachedFile: { name: string; previewUrl: string } | null;
  onClearAttachment: () => void;
  samplePrompts: string[];
  onPromptSuggestionClick: (promptText: string) => void;
}

export default function MessageInput({
  inputValue,
  setInputValue,
  onSubmit,
  onClearContext,
  isLoading,
  canClearContext,
  onFileAttach,
  attachedFile,
  onClearAttachment,
  samplePrompts,
  onPromptSuggestionClick,
}: MessageInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      // We can toast once, or disable mic button. For now, just log and button won't work.
      console.warn("Speech recognition not supported by this browser.");
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false; // Process speech after a pause
    recognition.interimResults = false; // Only final results for simplicity
    recognition.lang = typeof window !== "undefined" ? navigator.language : 'en-US';

    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          transcript += event.results[i][0].transcript;
        }
      }
      if (transcript) {
        setInputValue(inputValue ? inputValue + ' ' + transcript : transcript);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      let errorMessage = 'Speech recognition error.';
      if (event.error === 'no-speech') {
        errorMessage = 'No speech detected. Please try again.';
      } else if (event.error === 'audio-capture') {
        errorMessage = 'Microphone problem. Ensure it is enabled and working.';
      } else if (event.error === 'not-allowed') {
        errorMessage = 'Microphone access denied. Please enable it in your browser settings.';
      }
      toast({ variant: 'destructive', title: 'Voice Input Error', description: errorMessage });
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognitionRef.current?.stop();
    };
  }, [toast, setInputValue, inputValue]);

  const handleToggleListening = () => {
    if (!recognitionRef.current) {
      toast({ variant: 'destructive', title: 'Voice Input Not Supported', description: 'Your browser does not support speech recognition.'});
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        setInputValue(''); // Clear input when starting new voice input
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error("Error starting recognition:", e);
        toast({ variant: 'destructive', title: 'Voice Input Error', description: 'Could not start voice recognition.' });
        setIsListening(false);
      }
    }
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }
    onSubmit(inputValue);
  };


  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileAttach(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const showPromptSuggestions = !isLoading && !inputValue.trim() && !attachedFile && samplePrompts && samplePrompts.length > 0 && !isListening;

  return (
    <div className="p-4 border-t border-border/50 bg-card/70 backdrop-blur-md shadow-lg">
      {showPromptSuggestions && (
        <PromptSuggestions
          prompts={samplePrompts}
          onPromptClick={onPromptSuggestionClick}
        />
      )}
      {attachedFile && (
        <div className="mb-2 p-2 border border-border/50 rounded-md flex items-center justify-between bg-background/50">
          <div className="flex items-center gap-2 overflow-hidden">
            <Image
              src={attachedFile.previewUrl}
              alt={attachedFile.name}
              width={40}
              height={40}
              className="rounded-sm object-cover"
              data-ai-hint="attachment preview"
            />
            <span className="text-sm text-muted-foreground truncate">
              {attachedFile.name}
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClearAttachment}
            disabled={isLoading || isListening}
            aria-label="Clear attachment"
            className="text-muted-foreground hover:text-destructive"
          >
            <X size={18} />
          </Button>
        </div>
      )}
      <form
        onSubmit={handleFormSubmit}
        className="flex items-center gap-3"
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onClearContext}
          disabled={isLoading || !canClearContext || isListening}
          aria-label="Clear conversation context"
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 size={20} />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleFileButtonClick}
          disabled={isLoading || isListening}
          aria-label="Attach file"
          className="text-muted-foreground hover:text-primary"
        >
          <Paperclip size={20} />
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelected}
          accept="image/*"
          className="hidden"
          aria-hidden="true"
        />
        <Input
          type="text"
          placeholder={isListening ? "Listening..." : "Send a message or attach an image..."}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={isLoading || isListening}
          className="flex-grow"
          aria-label="Message input"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleToggleListening}
          disabled={isLoading || !recognitionRef.current}
          aria-label={isListening ? "Stop listening" : "Start voice input"}
          className={cn(
            "text-muted-foreground hover:text-primary",
            isListening && "text-destructive hover:text-destructive/80 animate-pulse"
          )}
        >
          {isListening ? <MicOff size={20} /> : <Mic size={20} />}
        </Button>
        <Button type="submit" disabled={isLoading || (!inputValue.trim() && !attachedFile) || isListening} aria-label="Send message">
          {isLoading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <Send size={20} />
          )}
        </Button>
      </form>
    </div>
  );
}
