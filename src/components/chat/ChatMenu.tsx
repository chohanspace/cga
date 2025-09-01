
'use client';

import type React from 'react';
import { useState, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Menu, Check, MessageSquarePlus, UserCog, LogOut, Brain, Users, Volume2, VolumeX, History, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/context/AuthContext';
import { ScrollArea } from '@/components/ui/scroll-area';


interface ChatMenuProps {
  currentModel: string;
  onModelChange: (model: string) => void;
  availableModels: string[];
  onClearContext: () => void;
  onLogout: () => void;
  onOpenEditProfile: () => void;
  isSpeechOutputEnabled: boolean;
  onToggleSpeechOutput: () => void;
  onSelectChat: (chatId: string) => void;
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
  onSelectChat
}: ChatMenuProps) {

  const { listUserChats } = useAuth();
  const [savedChats, setSavedChats] = useState<string[]>([]);
  const [isLoadingChats, setIsLoadingChats] = useState(false);

  const handleMenuOpen = async (isOpen: boolean) => {
    if (isOpen && savedChats.length === 0) {
      setIsLoadingChats(true);
      const chats = await listUserChats();
      setSavedChats(chats);
      setIsLoadingChats(false);
    }
  };


  return (
    <DropdownMenu onOpenChange={handleMenuOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Open Menu">
          <Menu size={20} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Chat Options</DropdownMenuLabel>
          <DropdownMenuItem onClick={onClearContext} className="cursor-pointer">
            <MessageSquarePlus className="mr-2 h-4 w-4" />
            <span>New AI Chat</span>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link href="/live-chat">
              <Users className="mr-2 h-4 w-4" />
              <span>Live Group Chat</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        
        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <History className="mr-2 h-4 w-4" />
              <span>Saved Chats</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent className="p-0">
                <ScrollArea className="max-h-60">
                   <div className="p-1">
                      {isLoadingChats ? (
                        <div className="flex items-center justify-center p-4">
                          <Loader2 className="h-5 w-5 animate-spin" />
                        </div>
                      ) : savedChats.length > 0 ? (
                        savedChats.map((chatId) => (
                          <DropdownMenuItem key={chatId} onClick={() => onSelectChat(chatId)} className="cursor-pointer">
                            <span>{chatId}</span>
                          </DropdownMenuItem>
                        ))
                      ) : (
                        <DropdownMenuLabel className="font-normal text-muted-foreground">No saved chats found.</DropdownMenuLabel>
                      )}
                    </div>
                </ScrollArea>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
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
              {currentModel === model && <Check size={16} className="text-primary" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
