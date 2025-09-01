
'use client';

import type { Message } from './ChatInterface';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { User, Bot, Loader2, Download, Eye, Copy as CopyIcon } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import NextImage from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface MessageItemProps {
  message: Message;
  isSpeechOutputEnabled: boolean;
  isGenerationStopped: boolean;
  onDisplayFinalized?: (messageId: string) => void;
}

const CodeBlockComponent = ({ language, code, onCopy }: { language: string; code: string; onCopy: (code: string) => void }) => {
  const langClass = language ? `language-${language}` : '';
  return (
    <div className="relative bg-muted/70 backdrop-blur-sm p-3 pr-10 rounded-md my-2 font-code text-sm shadow-inner overflow-x-auto border border-border/30">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-1 right-1 h-7 w-7 text-muted-foreground hover:text-foreground z-10"
        onClick={() => onCopy(code)}
        aria-label="Copy code"
      >
        <CopyIcon size={16} />
      </Button>
      {language && <div className="absolute top-[0.3rem] left-2 text-xs text-muted-foreground opacity-70 select-none">{language}</div>}
      <pre className={cn("pt-4 whitespace-pre-wrap break-words", language && "pt-5")}><code className={langClass}>{code}</code></pre>
    </div>
  );
};

const stripMarkdownForSpeech = (text: string): string => {
  if (!text) return '';
  let processedText = text.replace(/```(\w*\n)?([\s\S]*?)```/g, '(code snippet)');
  processedText = processedText.replace(/\*\*(.*?)\*\*/g, '$1');
  processedText = processedText.replace(/\[GENERATE_IMAGE:.*?\]/g, '');
  processedText = processedText.replace(/\s\s+/g, ' ');
  return processedText.trim();
};


const renderFormattedMessage = (text: string, handleCopyCode: (code: string) => void) => {
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)\n```/g;
  const parts: (JSX.Element | string)[] = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    const [fullMatch, language, codeContent] = match;
    const plainTextBefore = text.substring(lastIndex, match.index);

    if (plainTextBefore) {
      plainTextBefore.split(/(\*\*.*?\*\*)/g).forEach((segment, i) => {
        if (segment.startsWith('**') && segment.endsWith('**')) {
          parts.push(<strong key={`bold-${lastIndex}-${i}`}>{segment.slice(2, -2)}</strong>);
        } else if (segment) {
          parts.push(segment);
        }
      });
    }

    parts.push(
      <CodeBlockComponent
        key={`code-${match.index}`}
        language={language.toLowerCase()}
        code={codeContent}
        onCopy={handleCopyCode}
      />
    );
    lastIndex = match.index + fullMatch.length;
  }

  const remainingText = text.substring(lastIndex);
  if (remainingText) {
    remainingText.split(/(\*\*.*?\*\*)/g).forEach((segment, i) => {
      if (segment.startsWith('**') && segment.endsWith('**')) {
        parts.push(<strong key={`bold-final-${i}`}>{segment.slice(2, -2)}</strong>);
      } else if (segment) {
        parts.push(segment);
      }
    });
  }
  
  if (parts.length === 0 && text === '') {
    return <React.Fragment>&nbsp;</React.Fragment>;
  }
  if (parts.length === 0 && text) {
    return <React.Fragment>{text}</React.Fragment>;
  }

  return parts.map((part, index) => 
    typeof part === 'string' 
      ? <React.Fragment key={`frag-${index}`}>{part}</React.Fragment> 
      : part
  );
};


export default function MessageItem({ message, isSpeechOutputEnabled, isGenerationStopped, onDisplayFinalized }: MessageItemProps) {
  const isUser = message.role === 'user';
  const [imageToView, setImageToView] = useState<string | null>(null);
  const [imageNameToDownload, setImageNameToDownload] = useState<string | null>(null);
  const [displayedContent, setDisplayedContent] = useState<string>(message.content || '');
  const [isHovered, setIsHovered] = useState(false);
  const { toast } = useToast();
  const displayFinalizedCalledRef = useRef(false);

  useEffect(() => {
    // This effect now only handles calling `onDisplayFinalized` when a new model message is fully rendered.
    // We only call it ONCE per message ID to avoid issues.
    if (!displayFinalizedCalledRef.current) {
        if(message.role === 'model') {
            onDisplayFinalized?.(message.id);
            displayFinalizedCalledRef.current = true;
        }
    }
  }, [message.id, message.content, message.imageUrl, message.isGeneratingImage, onDisplayFinalized]);


  useEffect(() => {
    // If the content changes, update the display
    setDisplayedContent(message.content || '');
  }, [message.content]);

  useEffect(() => {
    if (
      isSpeechOutputEnabled &&
      message.role === 'model' &&
      !message.isGeneratingImage &&
      !message.imageUrl &&
      message.content &&
      !isGenerationStopped &&
      typeof window !== 'undefined' && window.speechSynthesis
    ) {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
      const textToSpeak = stripMarkdownForSpeech(message.content);
      if (textToSpeak) {
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.lang = typeof window !== "undefined" ? navigator.language : 'en-US';
        window.speechSynthesis.speak(utterance);
      }
    }
  }, [isSpeechOutputEnabled, message.role, message.content, message.imageUrl, message.isGeneratingImage, isGenerationStopped, message.id]);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);


  const handleDownloadImage = () => {
    if (!imageToView) return;
    const link = document.createElement('a');
    link.href = imageToView;
    let filename = imageNameToDownload || "downloaded_image.png";
    if (imageToView === message.imageUrl && !filename.toLowerCase().match(/\.(png|jpg|jpeg|gif|webp)$/)) {
        const mimeTypeMatch = imageToView.match(/^data:(image\/([a-zA-Z]+));base64,/);
        const extension = mimeTypeMatch && mimeTypeMatch[2] ? mimeTypeMatch[2] : 'png';
        filename = `${filename.substring(0, filename.lastIndexOf('.')) || filename}.${extension}`;
    }
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setImageToView(null);
    setImageNameToDownload(null);
  };

  const openImageDialog = (url: string, name?: string) => {
    setImageToView(url);
    setImageNameToDownload(name || `generated_image_${Date.now()}.png`);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
      .then(() => {
        toast({ title: "Code copied to clipboard!", duration: 2000 });
      })
      .catch(err => {
        console.error('Failed to copy code: ', err);
        toast({ variant: 'destructive', title: "Copy failed", description: "Could not copy code to clipboard.", duration: 2000 });
      });
  };

  const handleCopyFullMessage = (text: string) => {
    if (!text) return;
    const textToCopy = stripMarkdownForSpeech(text); 
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        toast({ title: "Message copied to clipboard!", duration: 2000 });
      })
      .catch(err => {
        console.error('Failed to copy message: ', err);
        toast({ variant: 'destructive', title: "Copy failed", description: "Could not copy message.", duration: 2000 });
      });
  };
  
  const ImageDisplay = ({ src, alt, name, isUserAttachment }: { src: string; alt: string; name?: string; isUserAttachment?: boolean }) => (
    <Dialog onOpenChange={(isOpen) => !isOpen && (setImageToView(null), setImageNameToDownload(null))}>
      <DialogTrigger asChild>
        <div 
          className="relative group cursor-pointer mt-2 rounded-md overflow-hidden shadow-md w-full aspect-video"
          onClick={() => openImageDialog(src, name)}
          data-ai-hint={isUserAttachment ? "attachment preview" : "generated art"}
        >
          <NextImage
            src={src}
            alt={alt}
            fill 
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" 
            style={{ objectFit: 'cover' }} 
            className="group-hover:opacity-80 transition-opacity"
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 flex items-center justify-center transition-all duration-300">
            <Eye size={32} className="text-white opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300" />
          </div>
        </div>
      </DialogTrigger>
      {imageToView === src && (
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-4 bg-background/80 backdrop-blur-md">
          <DialogHeader>
            <DialogTitle className="truncate">{name || alt}</DialogTitle>
          </DialogHeader>
          <div className="flex-grow overflow-auto my-4 flex items-center justify-center">
            <img src={src} alt={alt} className="max-w-full max-h-[70vh] object-contain rounded-md" />
          </div>
          <DialogFooter className="sm:justify-end gap-2">
            <Button variant="outline" onClick={() => {setImageToView(null); setImageNameToDownload(null);}}>Close</Button>
            <Button onClick={handleDownloadImage}>
              <Download size={16} className="mr-2" />
              Download
            </Button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );

  const hasTextContent = displayedContent && displayedContent.trim() !== '';
  const containsCodeBlock = message.content && message.content.includes('```');
  const showCopyButton = hasTextContent && !containsCodeBlock && !message.attachment && !message.imageUrl && !message.isGeneratingImage && isHovered;


  return (
    <div
      className={cn(
        'flex items-start gap-3 p-1 animate-message-in',
        isUser ? 'justify-end' : 'justify-start'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {!isUser && (
        <Avatar className="h-8 w-8 shrink-0 border border-accent/30 shadow-md">
          <AvatarFallback className="bg-accent text-accent-foreground">
            <Bot size={18} />
          </AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          'relative max-w-[75%] p-3 shadow-lg text-sm flex flex-col gap-1', 
          isUser
            ? 'bg-primary text-primary-foreground rounded-lg rounded-br-sm border-transparent'
            : 'bg-card/70 backdrop-blur-sm text-card-foreground rounded-lg rounded-lg rounded-bl-sm border border-border/40'
        )}
      >
        {showCopyButton && (
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "absolute h-6 w-6 text-muted-foreground hover:text-foreground z-10 transition-opacity",
              isUser ? "top-1 left-1" : "top-1 right-1" 
            )}
            onClick={() => handleCopyFullMessage(displayedContent)}
            aria-label="Copy message text"
          >
            <CopyIcon size={14} />
          </Button>
        )}

        {(displayedContent || (message.role === 'model' && message.content)) && (
          <div className="whitespace-pre-wrap break-words"> 
            {renderFormattedMessage(displayedContent, handleCopyCode)}
          </div>
        )}
        
        {message.attachment && (
          <div className="mt-2 border-t border-border/50 pt-2">
            <p className="text-xs text-muted-foreground/80 mb-1">Attached: {message.attachment.name}</p>
             <ImageDisplay src={message.attachment.url} alt={message.attachment.name || 'Attached image'} name={message.attachment.name} isUserAttachment />
          </div>
        )}

        {message.isGeneratingImage && !message.imageUrl && ( 
           <div className="flex items-center gap-2 text-muted-foreground p-2 rounded-md bg-background/50 backdrop-blur-sm mt-2">
            <Loader2 size={16} className="animate-spin" />
            <span>Generating image...</span>
          </div>
        )}
        
        {message.imageUrl && ( 
          <ImageDisplay src={message.imageUrl} alt="Generated AI image" name={`ai_image_${message.id}.png`} />
        )}
      </div>
      {isUser && (
        <Avatar className="h-8 w-8 shrink-0 border-transparent shadow-md">
          <AvatarFallback className="bg-primary text-primary-foreground">
            <User size={18} />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
