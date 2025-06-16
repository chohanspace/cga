
'use client';

import type React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import Link from 'next/link';
import { useState } from 'react';
import { Loader2, Check, XCircle } from 'lucide-react';

const formSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(20, 'Username must be at most 20 characters'),
  password: z.string().min(6, 'Password must be 6-18 characters').max(18, 'Password must be 6-18 characters'),
});

type FormData = z.infer<typeof formSchema>;

interface AuthFormProps {
  mode: 'login' | 'signup';
  onSubmit: (data: FormData) => Promise<boolean>;
}

export default function AuthForm({ mode, onSubmit }: AuthFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authStatus, setAuthStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const handleSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setAuthStatus('pending');
    
    const success = await onSubmit(data);

    if (success) {
      setAuthStatus('success');
      // Navigation is handled by AuthContext.
      // isSubmitting remains true as the component will likely unmount or navigate away.
    } else {
      setAuthStatus('error');
      setTimeout(() => {
        setAuthStatus('idle');
        setIsSubmitting(false); // Re-enable form for another attempt
      }, 2000); // Show error state for 2 seconds
    }
  };

  return (
    <Card className="w-full max-w-sm shadow-2xl border-border/50">
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-center text-primary">
          {mode === 'login' ? 'Welcome Back!' : 'Create Account'}
        </CardTitle>
        <CardDescription className="text-center">
          {mode === 'login' ? 'Log in to continue to AbduDev AI.' : 'Enter your details to get started.'}
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="your_username" {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {authStatus === 'pending' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : authStatus === 'success' ? (
                <>
                  <Check className="mr-2 h-5 w-5 text-green-500" />
                  Success!
                </>
              ) : authStatus === 'error' ? (
                <>
                  <XCircle className="mr-2 h-5 w-5 text-destructive" />
                  {mode === 'login' ? 'Login Failed' : 'Signup Failed'}
                </>
              ) : (
                mode === 'login' ? 'Log In' : 'Sign Up'
              )}
            </Button>
            <div className="text-sm text-center">
              {mode === 'login' ? (
                <>
                  Don&apos;t have an account?{' '}
                  <Link href="/auth/signup" className="font-medium text-primary hover:underline" tabIndex={isSubmitting ? -1 : undefined}>
                    Sign up
                  </Link>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <Link href="/auth/login" className="font-medium text-primary hover:underline" tabIndex={isSubmitting ? -1 : undefined}>
                    Log in
                  </Link>
                </>
              )}
            </div>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
