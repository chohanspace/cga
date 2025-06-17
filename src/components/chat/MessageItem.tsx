
'use client';

import type { Message } from './ChatInterface';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { User, Bot, Loader2, Download, Eye, Copy } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import NextImage from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface MessageItemProps {
  message: Message;
}

const TYPEWRITER_SPEED_MS = 30; // Speed in milliseconds per character

const renderFormattedMessage = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    // To ensure the cursor has space to "blink" at the end of an empty or partially typed line
    if (text === '' && index === 0) return <React.Fragment key={index}>&nbsp;</React.Fragment>;
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
};

export default function MessageItem({ message }: MessageItemProps) {
  const isUser = message.role === 'user';
  const [imageToView, setImageToView] = useState<string | null>(null);
  const [imageNameToDownload, setImageNameToDownload] = useState<string | null>(null);
  const [displayedContent, setDisplayedContent] = useState<string>('');
  const { toast } = useToast();

  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressTriggeredRef = useRef(false);

  useEffect(() => {
    if (isUser || message.isGeneratingImage || message.imageUrl || message.attachment ) {
      setDisplayedContent(message.content);
      return;
    }

    // Typewriter effect for AI model text messages
    if (message.role === 'model' && message.content) {
      let charIndex = 0;
      setDisplayedContent(''); // Reset for new message
      const intervalId = setInterval(() => {
        setDisplayedContent((prev) => prev + message.content[charIndex]);
        charIndex++;
        if (charIndex === message.content.length) {
          clearInterval(intervalId);
        }
      }, TYPEWRITER_SPEED_MS);
      return () => clearInterval(intervalId);
    }
  }, [message.content, message.role, message.id, isUser, message.isGeneratingImage, message.imageUrl, message.attachment]);


  const handleDownload = () => {
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

  const handleInteractionStart = () => {
    isLongPressTriggeredRef.current = false;
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
    longPressTimerRef.current = setTimeout(() => {
      if (message.content) {
        navigator.clipboard.writeText(message.content)
          .then(() => {
            toast({ title: "Copied to clipboard!", duration: 2000 });
          })
          .catch(err => {
            console.error('Failed to copy text: ', err);
            toast({ variant: 'destructive', title: "Copy failed", description: "Could not copy text to clipboard.", duration: 2000 });
          });
        isLongPressTriggeredRef.current = true;
      }
    }, 790);
  };

  const handleInteractionEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    if (isLongPressTriggeredRef.current) {
      e.preventDefault(); // Prevent context menu if long press copy was triggered
    }
  };
  
  const ImageDisplay = ({ src, alt, name, isUserAttachment }: { src: string; alt: string; name?: string; isUserAttachment?: boolean }) => (
    <Dialog onOpenChange={(isOpen) => !isOpen && (setImageToView(null), setImageNameToDownload(null))}>
      <DialogTrigger asChild>
        <div 
          className="relative group cursor-pointer mt-2 rounded-md overflow-hidden shadow-md w-full aspect-video"
          onClick={() => openImageDialog(src, name)}
          data-ai-hint={isUserAttachment ? "attached image" : "generated art"}
        >
          <NextImage
            src={src}
            alt={alt}
            layout="fill"
            objectFit="cover"
            className="group-hover:opacity-80 transition-opacity"
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 flex items-center justify-center transition-all duration-300">
            <Eye size={32} className="text-white opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300" />
          </div>
        </div>
      </DialogTrigger>
      {imageToView === src && (
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-4">
          <DialogHeader>
            <DialogTitle className="truncate">{name || alt}</DialogTitle>
          </DialogHeader>
          <div className="flex-grow overflow-auto my-4 flex items-center justify-center">
            <img src={src} alt={alt} className="max-w-full max-h-[70vh] object-contain rounded-md" />
          </div>
          <DialogFooter className="sm:justify-end gap-2">
            <Button variant="outline" onClick={() => {setImageToView(null); setImageNameToDownload(null);}}>Close</Button>
            <Button onClick={handleDownload}>
              <Download size={16} className="mr-2" />
              Download
            </Button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );

  const isAiTyping = message.role === 'model' && 
                     !message.isGeneratingImage &&
                     !message.imageUrl && 
                     !message.attachment &&
                     message.content && 
                     displayedContent.length < message.content.length;

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-1 animate-message-in',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {!isUser && (
        <Avatar className="h-8 w-8 shrink-0 border border-accent/50 shadow-md">
          <AvatarFallback className="bg-accent text-accent-foreground">
            <Bot size={18} />
          </AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          'max-w-[75%] p-3 shadow-lg text-sm flex flex-col gap-2 select-none', // Added select-none
          isUser
            ? 'bg-primary text-primary-foreground rounded-lg rounded-br-sm border border-primary/70'
            : 'bg-card text-card-foreground rounded-lg rounded-bl-sm border border-border/70'
        )}
        onMouseDown={handleInteractionStart}
        onMouseUp={handleInteractionEnd}
        onMouseLeave={handleInteractionEnd} // Clear timer if mouse leaves element
        onTouchStart={handleInteractionStart}
        onTouchEnd={handleInteractionEnd}
        onContextMenu={handleContextMenu}
      >
        {(message.content || (message.role === 'model' && displayedContent !== undefined)) && (
          <p className="whitespace-pre-wrap">
            {renderFormattedMessage(displayedContent)}
            {isAiTyping && <span className="inline-block animate-pulse">|</span>}
          </p>
        )}
        
        {message.attachment && (
          <div className="mt-2 border-t border-border/30 pt-2">
            <p className="text-xs text-muted-foreground mb-1">Attached: {message.attachment.name}</p>
             <ImageDisplay src={message.attachment.url} alt={message.attachment.name || 'Attached image'} name={message.attachment.name} isUserAttachment />
          </div>
        )}

        {message.isGeneratingImage && !message.imageUrl && (
           <div className="flex items-center gap-2 text-muted-foreground p-2 rounded-md bg-background/30 mt-2">
            <Loader2 size={16} className="animate-spin" />
            <span>Generating image...</span>
          </div>
        )}
        
        {message.imageUrl && (
          <ImageDisplay src={message.imageUrl} alt="Generated AI image" name={`ai_image_${message.id}.png`} />
        )}
      </div>
      {isUser && (
        <Avatar className="h-8 w-8 shrink-0 border border-primary/50 shadow-md">
          <AvatarFallback className="bg-primary text-primary-foreground">
            <User size={18} />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
