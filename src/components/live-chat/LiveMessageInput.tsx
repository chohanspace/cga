
'use client';

import type React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Loader2 } from 'lucide-react';

interface LiveMessageInputProps {
  inputValue: string;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
}

export default function LiveMessageInput({
  inputValue,
  onInputChange,
  onSubmit,
  isLoading,
}: LiveMessageInputProps) {
  return (
    <div className="p-4 border-t border-border/50 bg-card/70 backdrop-blur-md shadow-lg">
      <form
        onSubmit={onSubmit}
        className="flex items-center gap-3"
      >
        <Input
          type="text"
          placeholder="Type a message to the group..."
          value={inputValue}
          onChange={onInputChange}
          disabled={isLoading}
          className="flex-grow"
          aria-label="Message input"
          autoComplete="off"
        />
        <Button type="submit" disabled={isLoading || !inputValue.trim()} aria-label="Send message">
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
