
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
import { Menu, Check, MessageSquarePlus, UserCog, LogOut, Brain, Users } from 'lucide-react';
import Link from 'next/link';

interface ChatMenuProps {
  currentModel: string;
  onModelChange: (model: string) => void;
  availableModels: string[];
  onClearContext: () => void;
  onLogout: () => void;
  onOpenEditProfile: () => void;
}

export default function ChatMenu({
  currentModel,
  onModelChange,
  availableModels,
  onClearContext,
  onLogout,
  onOpenEditProfile,
}: ChatMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Open Menu">
          <Menu size={20} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Chat Options</DropdownMenuLabel>
          <DropdownMenuItem onClick={onClearContext}>
            <MessageSquarePlus className="mr-2 h-4 w-4" />
            <span>New AI Chat</span>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/live-chat" className="w-full">
              <Users className="mr-2 h-4 w-4" />
              <span>Live Group Chat</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>Profile</DropdownMenuLabel>
          <DropdownMenuItem onClick={onOpenEditProfile}>
            <UserCog className="mr-2 h-4 w-4" />
            <span>Edit Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onLogout}>
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
              className="flex justify-between items-center w-full"
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
