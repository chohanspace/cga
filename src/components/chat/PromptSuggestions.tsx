
'use client';

import type React from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'; // For horizontal scrolling
import { Sparkles } from 'lucide-react'; // Optional: for a nice icon

interface PromptSuggestionsProps {
  prompts: string[];
  onPromptClick: (promptText: string) => void;
}

export default function PromptSuggestions({ prompts, onPromptClick }: PromptSuggestionsProps) {
  if (!prompts || prompts.length === 0) {
    return null;
  }

  return (
    <div className="mb-3 pb-1">
      <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
        <Sparkles size={16} className="text-primary" />
        <span>Try these:</span>
      </div>
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-2 pb-2">
          {prompts.map((prompt, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              className="text-xs h-auto py-1.5 px-3 rounded-full border-dashed border-primary/50 hover:border-primary hover:bg-primary/10 text-primary/90 hover:text-primary transition-all duration-150 ease-in-out shadow-sm hover:shadow-md"
              onClick={() => onPromptClick(prompt)}
            >
              {prompt}
            </Button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
