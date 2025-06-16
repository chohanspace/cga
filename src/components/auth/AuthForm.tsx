
'use client';

import type React from 'react';
import { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import Link from 'next/link';
import { Loader2, Check, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(20, 'Username must be at most 20 characters'),
  password: z.string().min(6, 'Password must be 6-18 characters').max(18, 'Password must be 6-18 characters'),
});

type FormData = z.infer<typeof formSchema>;

interface AuthFormProps {
  mode: 'login' | 'signup';
  onSubmit: (data: FormData) => Promise<boolean>;
}

const TYPING_SPEED = 120;
const DELETING_SPEED = 70;
const PAUSE_DURATION_AFTER_TYPING = 1800;
const PAUSE_DURATION_BEFORE_NEXT_PHRASE = 400;

interface AnimatedPhraseConfig {
  text: string;
  isFinal?: boolean;
}

export default function AuthForm({ mode, onSubmit }: AuthFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authStatus, setAuthStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');

  const [displayedText, setDisplayedText] = useState('');
  const [currentPhraseConfigIndex, setCurrentPhraseConfigIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPausedForAnimation, setIsPausedForAnimation] = useState(false);


  const phraseConfigurations: AnimatedPhraseConfig[] = useMemo(() => [
    { text: "Welcome to AbduDev AI" },
    { text: "Pakistan's first AI Assistant" },
    {
      text: mode === 'login' ? "Log into AbduDev AI to get started" : "Sign up in AbduDev AI to get started",
      isFinal: true,
    },
  ], [mode]);

  useEffect(() => {
    const currentConfig = phraseConfigurations[currentPhraseConfigIndex];

    if (!currentConfig || currentPhraseConfigIndex >= phraseConfigurations.length) {
      return; 
    }

    if (isPausedForAnimation) {
      return;
    }

    let animationStepTimeoutId: NodeJS.Timeout | undefined;

    if (!isDeleting) { 
      if (charIndex < currentConfig.text.length) {
        setDisplayedText(currentConfig.text.substring(0, charIndex + 1));
        animationStepTimeoutId = setTimeout(() => {
          setCharIndex(charIndex + 1);
        }, TYPING_SPEED);
      } else { 
        if (currentConfig.isFinal) return; 

        setIsPausedForAnimation(true); 
        setTimeout(() => {
          setIsDeleting(true);
          setIsPausedForAnimation(false); 
        }, PAUSE_DURATION_AFTER_TYPING);
      }
    } else { 
      if (charIndex > 0) {
        setDisplayedText(currentConfig.text.substring(0, charIndex - 1));
        animationStepTimeoutId = setTimeout(() => {
          setCharIndex(charIndex - 1);
        }, DELETING_SPEED);
      } else { 
        setIsPausedForAnimation(true); 
        setTimeout(() => {
          setIsDeleting(false);
          setCurrentPhraseConfigIndex(prevIndex => {
            if (prevIndex + 1 >= phraseConfigurations.length) {
                return prevIndex; 
            }
            return prevIndex + 1;
          });
          setIsPausedForAnimation(false); 
        }, PAUSE_DURATION_BEFORE_NEXT_PHRASE);
      }
    }

    return () => {
      if (animationStepTimeoutId) {
        clearTimeout(animationStepTimeoutId);
      }
    };
  }, [charIndex, isDeleting, currentPhraseConfigIndex, phraseConfigurations, isPausedForAnimation]);


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
    } else {
      setAuthStatus('error');
      setTimeout(() => {
        setAuthStatus('idle');
        setIsSubmitting(false); 
      }, 2000); 
    }
  };
  
  const currentPhraseIsDoneAndFinal = 
    phraseConfigurations[currentPhraseConfigIndex]?.isFinal && 
    charIndex === phraseConfigurations[currentPhraseConfigIndex]?.text.length;

  return (
    <Card className="w-full max-w-sm shadow-2xl border-border/50">
      <CardHeader>
        <CardTitle 
            className="text-3xl font-bold text-center text-primary flex items-center justify-center h-20" 
            aria-live="polite"
        >
          <span className="relative">
            {displayedText}
            <span
              className={cn(
                'inline-block animate-pulse ml-0.5',
                (isPausedForAnimation || currentPhraseIsDoneAndFinal || currentPhraseConfigIndex >= phraseConfigurations.length) && 'opacity-0'
              )}
              aria-hidden="true"
            >
              |
            </span>
          </span>
        </CardTitle>
        <CardDescription className="text-center pt-2">
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
                  <Button asChild variant="link" className="p-1 transition-transform duration-150 hover:-translate-y-px active:translate-y-0" disabled={isSubmitting}>
                    <Link href="/auth/signup" tabIndex={isSubmitting ? -1 : undefined}>
                      Sign up
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                   <Button asChild variant="link" className="p-1 transition-transform duration-150 hover:-translate-y-px active:translate-y-0" disabled={isSubmitting}>
                    <Link href="/auth/login" tabIndex={isSubmitting ? -1 : undefined}>
                      Log in
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
