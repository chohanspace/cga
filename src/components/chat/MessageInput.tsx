
'use client';

import type React from 'react';
import { useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Trash2, Loader2, Paperclip, X } from 'lucide-react';
import Image from 'next/image';

interface MessageInputProps {
  inputValue: string;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onClearContext: () => void;
  isLoading: boolean;
  canClearContext: boolean;
  onFileAttach: (file: File) => void;
  attachedFile: { name: string; previewUrl: string } | null;
  onClearAttachment: () => void;
}

export default function MessageInput({
  inputValue,
  onInputChange,
  onSubmit,
  onClearContext,
  isLoading,
  canClearContext,
  onFileAttach,
  attachedFile,
  onClearAttachment,
}: MessageInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileAttach(file);
    }
    // Reset file input to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="p-4 border-t bg-card shadow-lg">
      {attachedFile && (
        <div className="mb-2 p-2 border border-border rounded-md flex items-center justify-between bg-background/50">
          <div className="flex items-center gap-2 overflow-hidden">
            <Image
              src={attachedFile.previewUrl}
              alt={attachedFile.name}
              width={40}
              height={40}
              className="rounded-sm object-cover"
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
            disabled={isLoading}
            aria-label="Clear attachment"
            className="text-muted-foreground hover:text-destructive"
          >
            <X size={18} />
          </Button>
        </div>
      )}
      <form
        onSubmit={onSubmit}
        className="flex items-center gap-3"
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onClearContext}
          disabled={isLoading || !canClearContext}
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
          disabled={isLoading}
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
          placeholder="Send a message or attach an image..."
          value={inputValue}
          onChange={onInputChange}
          disabled={isLoading}
          className="flex-grow"
          aria-label="Message input"
        />
        <Button type="submit" disabled={isLoading || (!inputValue.trim() && !attachedFile)} aria-label="Send message">
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
