
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

// Schema for the form data - username is not here as it's not editable
const profileFormSchema = z.object({
  nickname: z.string().min(3, 'Nickname must be at least 3 characters').max(20, 'Nickname must be at most 20 characters').optional().or(z.literal('')),
  pfpUrl: z.string().url('Please enter a valid URL for PFP').optional().or(z.literal('')),
  mobileNumber: z.string().optional().or(z.literal('')), // Add appropriate validation if needed, e.g., .regex(/^\+[1-9]\d{1,14}$/, 'Invalid phone number')
  email: z.string().email('Please enter a valid email address').optional().or(z.literal('')),
});

type ProfileFormData = z.infer<typeof profileFormSchema>;

interface EditProfileDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  user: UserProfile; // UserProfile contains the fixed username and changeable nickname
}

export default function EditProfileDialog({ isOpen, onOpenChange, user }: EditProfileDialogProps) {
  const { updateUserProfile, currentUser } = useAuth(); // currentUser to display fixed username
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    // Default values will be set by useEffect
    defaultValues: {
      nickname: '',
      pfpUrl: '',
      mobileNumber: '',
      email: '',
    },
  });

  useEffect(() => {
    // Reset form when dialog opens or user data changes
    if (user && isOpen) {
      form.reset({
        nickname: user.nickname || '', // Use nickname, fallback to empty if not set
        pfpUrl: user.pfpUrl || '',
        mobileNumber: user.mobileNumber || '',
        email: user.email || '',
      });
    }
  }, [user, isOpen, form]);

  const handleSubmit = async (data: ProfileFormData) => {
    setIsSubmitting(true);
    // Construct UserProfileUpdate, username is not part of it
    const profileUpdateData: UserProfileUpdate = {
        nickname: data.nickname, // nickname can be empty string, context will handle it
        pfpUrl: data.pfpUrl,
        mobileNumber: data.mobileNumber,
        email: data.email
    };

    const success = await updateUserProfile(profileUpdateData);
    if (success) {
      // Toast is handled by updateUserProfile now
      onOpenChange(false);
    } else {
      // Error toast also handled by updateUserProfile or a general error case
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: 'Could not update your profile. An unexpected error occurred.',
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
            Your username (<span className="font-semibold text-primary">{currentUser?.username}</span>) cannot be changed.
            Modify your other details below.
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
                    <Input placeholder="Your display name (e.g., AwesomeUser123)" {...field} disabled={isSubmitting} />
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
                    <Input placeholder="https://example.com/your-avatar.png" {...field} disabled={isSubmitting} />
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
                  <FormLabel>Mobile Number (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="+1234567890" {...field} disabled={isSubmitting} />
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
                  <FormLabel>Email (Optional)</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="you@example.com" {...field} disabled={isSubmitting} />
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
