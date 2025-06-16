'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Trash2, Loader2 } from 'lucide-react';
import type React from 'react';

interface MessageInputProps {
  inputValue: string;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onClear: () => void;
  isLoading: boolean;
  canClear: boolean;
}

export default function MessageInput({
  inputValue,
  onInputChange,
  onSubmit,
  onClear,
  isLoading,
  canClear,
}: MessageInputProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="p-4 border-t bg-card flex items-center gap-3"
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onClear}
        disabled={isLoading || !canClear}
        aria-label="Clear conversation context"
        className="text-muted-foreground hover:text-destructive"
      >
        <Trash2 size={20} />
      </Button>
      <Input
        type="text"
        placeholder="Type your message to Gemini..."
        value={inputValue}
        onChange={onInputChange}
        disabled={isLoading}
        className="flex-grow"
        aria-label="Message input"
      />
      <Button type="submit" disabled={isLoading || !inputValue.trim()} aria-label="Send message">
        {isLoading ? (
          <Loader2 size={20} className="animate-spin" />
        ) : (
          <Send size={20} />
        )}
      </Button>
    </form>
  );
}
