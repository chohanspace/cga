
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

// Schema for the form data - username/email is not here as it's not editable
const profileFormSchema = z.object({
  nickname: z.string().min(3, 'Nickname must be at least 3 characters').max(20, 'Nickname must be at most 20 characters').optional().or(z.literal('')),
  pfpUrl: z.string().url('Please enter a valid URL for PFP').optional().or(z.literal('')),
  mobileNumber: z.string().optional().or(z.literal('')),
});

type ProfileFormData = z.infer<typeof profileFormSchema>;

interface EditProfileDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  user: UserProfile; 
}

export default function EditProfileDialog({ isOpen, onOpenChange, user }: EditProfileDialogProps) {
  const { updateUserProfile, currentUser } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      nickname: '',
      pfpUrl: '',
      mobileNumber: '',
    },
  });

  useEffect(() => {
    if (user && isOpen) {
      form.reset({
        nickname: user.nickname || '',
        pfpUrl: user.pfpUrl || '',
        mobileNumber: user.mobileNumber || '',
      });
    }
  }, [user, isOpen, form]);

  const handleSubmit = async (data: ProfileFormData) => {
    setIsSubmitting(true);
    // Construct UserProfileUpdate
    const profileUpdateData: UserProfileUpdate = {
        nickname: data.nickname, 
        pfpUrl: data.pfpUrl,
        mobileNumber: data.mobileNumber,
    };

    const success = await updateUserProfile(profileUpdateData);
    if (success) {
      onOpenChange(false);
    } else {
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
            Your username (<span className="font-semibold text-primary">{currentUser?.username}</span>) and email cannot be changed.
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
             <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={currentUser?.email || ''} disabled readOnly />
                <p className="text-xs text-muted-foreground">Email address cannot be changed.</p>
            </div>

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
