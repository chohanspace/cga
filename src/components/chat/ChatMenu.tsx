
'use client';

import type React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Menu, Check, MessageSquarePlus, UserCog, LogOut, Brain, Users, Volume2, VolumeX } from 'lucide-react';
import Link from 'next/link';
import { Switch } from '@/components/ui/switch';
import { useRouter } from 'next/navigation';

interface ChatMenuProps {
  currentModel: string;
  onModelChange: (model: string) => void;
  availableModels: string[];
  onClearContext: () => void;
  onLogout: () => void;
  onOpenEditProfile: () => void;
  isSpeechOutputEnabled: boolean;
  onToggleSpeechOutput: () => void;
}

export default function ChatMenu({
  currentModel,
  onModelChange,
  availableModels,
  onClearContext,
  onLogout,
  onOpenEditProfile,
  isSpeechOutputEnabled,
  onToggleSpeechOutput,
}: ChatMenuProps) {
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Open Menu">
          <Menu size={20} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64 max-h-96 overflow-y-auto">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Chat Options</DropdownMenuLabel>
          <DropdownMenuItem onClick={onClearContext} className="cursor-pointer">
            <MessageSquarePlus className="mr-2 h-4 w-4" />
            <span>New AI Chat</span>
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => router.push('/live-chat')} 
            className="w-full cursor-pointer"
          >
            <Users className="mr-2 h-4 w-4" />
            <span>Live Group Chat</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>Accessibility</DropdownMenuLabel>
            <div 
                className="relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                onClick={(e) => e.stopPropagation()} 
            >
                {isSpeechOutputEnabled ? <Volume2 className="mr-2 h-4 w-4" /> : <VolumeX className="mr-2 h-4 w-4" />}
                <span className="flex-grow">Voice Responses</span>
                <Switch
                    checked={isSpeechOutputEnabled}
                    onCheckedChange={onToggleSpeechOutput}
                    aria-label="Toggle voice responses"
                    className="ml-auto"
                />
            </div>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>Profile</DropdownMenuLabel>
          <DropdownMenuItem onClick={onOpenEditProfile} className="cursor-pointer">
            <UserCog className="mr-2 h-4 w-4" />
            <span>Edit Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onLogout} className="cursor-pointer">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Logout</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center">
            <Brain className="mr-2 h-4 w-4" />
            <span>AI Model</span>
          </DropdownMenuLabel>
          {availableModels.map((model) => (
            <DropdownMenuItem
              key={model}
              onClick={() => onModelChange(model)}
              className="flex justify-between items-center w-full cursor-pointer"
            >
              <span>{model}</span>
              {currentModel === model && <Check size={16} className="ml-auto text-primary" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
