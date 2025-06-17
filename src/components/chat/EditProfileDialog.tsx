
'use client';

import type React from 'react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth, type UserProfileUpdate, type UserProfile } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const profileFormSchema = z.object({
  nickname: z.string().min(3, 'Nickname must be at least 3 characters').max(20, 'Nickname must be at most 20 characters').optional().or(z.literal('')),
  pfpUrl: z.string().url('Please enter a valid URL for PFP').optional().or(z.literal('')),
  mobileNumber: z.string().optional().or(z.literal('')),
  email: z.string().email('Please enter a valid email address').optional().or(z.literal('')),
});

// FormData will not include username
type ProfileFormData = z.infer<typeof profileFormSchema>;

interface EditProfileDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  user: UserProfile; // UserProfile now includes nickname
}

export default function EditProfileDialog({ isOpen, onOpenChange, user }: EditProfileDialogProps) {
  const { updateUserProfile, currentUser } = useAuth(); // currentUser for username display
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      nickname: user?.nickname || '',
      pfpUrl: user?.pfpUrl || '',
      mobileNumber: user?.mobileNumber || '',
      email: user?.email || '',
    },
  });

  useEffect(() => {
    if (user && isOpen) { // Only reset if user or isOpen changes and dialog is open
      form.reset({
        nickname: user.nickname || user.username || '', // Fallback to username if nickname is empty
        pfpUrl: user.pfpUrl || '',
        mobileNumber: user.mobileNumber || '',
        email: user.email || '',
      });
    }
  }, [user, form, isOpen]);

  const handleSubmit = async (data: ProfileFormData) => {
    setIsSubmitting(true);
    // Construct UserProfileUpdate, username is not part of it
    const profileUpdateData: UserProfileUpdate = {
        nickname: data.nickname,
        pfpUrl: data.pfpUrl,
        mobileNumber: data.mobileNumber,
        email: data.email
    };

    const success = await updateUserProfile(profileUpdateData);
    if (success) {
      toast({
        title: 'Profile Updated',
        description: 'Your profile information has been saved.',
      });
      onOpenChange(false);
    } else {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: 'Could not update your profile. An error occurred.',
      });
    }
    setIsSubmitting(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Username <span className="font-semibold text-primary">{currentUser?.username}</span> cannot be changed.
            Make changes to your other profile details here. Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="nickname"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nickname</FormLabel>
                  <FormControl>
                    <Input placeholder="Your display name" {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="pfpUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profile Picture URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/image.png" {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="mobileNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mobile Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Your mobile number" {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="your@email.com" {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
