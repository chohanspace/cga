
'use client';

import type React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Menu, Check, MessageSquarePlus, UserCog, LogOut, Brain } from 'lucide-react';

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
      <DropdownMenuContent align="start" className="w-52"> {/* Reduced width from w-56 */}
        <DropdownMenuGroup>
          <DropdownMenuLabel>Chat Options</DropdownMenuLabel>
          <DropdownMenuItem onClick={onClearContext}>
            <MessageSquarePlus className="mr-2 h-4 w-4" />
            <span>Start New Chat</span>
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
         <DropdownMenuSub>
            <DropdownMenuSubTrigger>
                <Brain className="mr-2 h-4 w-4" />
                <span>AI Model</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent 
                className="p-0" 
                collisionPadding={10}
                sideOffset={4} // Added for potentially better positioning
                alignOffset={-4} // Added for potentially better positioning
            >
                 {availableModels.map((model) => (
                    <DropdownMenuItem
                        key={model}
                        onClick={() => onModelChange(model)}
                        className="flex justify-between items-center w-full"
                    >
                        {model}
                        {currentModel === model && <Check size={16} className="ml-auto text-primary" />}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
