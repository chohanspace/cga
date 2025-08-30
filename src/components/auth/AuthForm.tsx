
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
import { Loader2, Check, XCircle, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';


const signupSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be 6-18 characters').max(18, 'Password must be 6-18 characters'),
});

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string(), // No validation on login, server handles it
});

const otpSchema = z.object({
  otp: z.string().min(6, 'OTP must be 6 digits').max(6, 'OTP must be 6 digits'),
});


type SignupFormData = z.infer<typeof signupSchema>;
type LoginFormData = z.infer<typeof loginSchema>;
type OtpFormData = z.infer<typeof otpSchema>;


interface AuthFormProps {
  mode: 'login' | 'signup';
}

const TYPING_SPEED = 120;
const DELETING_SPEED = 70;
const PAUSE_DURATION_AFTER_TYPING = 1800;
const PAUSE_DURATION_BEFORE_NEXT_PHRASE = 400;

interface AnimatedPhraseConfig {
  text: string;
  isFinal?: boolean;
}

export default function AuthForm({ mode }: AuthFormProps) {
  const { signup, login, verifyOtpAndLogin, resendOtp } = useAuth();
  const [authStep, setAuthStep] = useState<'credentials' | 'otp'>('credentials');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authStatus, setAuthStatus] = useState<'idle' | 'pending' | 'success' | 'error' | 'needs_verification'>('idle');
  const [emailForOtp, setEmailForOtp] = useState('');
  
  const [displayedText, setDisplayedText] = useState('');
  const [currentPhraseConfigIndex, setCurrentPhraseConfigIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPausedForAnimation, setIsPausedForAnimation] = useState(false);


  const phraseConfigurations: AnimatedPhraseConfig[] = useMemo(() => [
    { text: "Welcome to ChohanGenAI" },
    { text: "Pakistan's first AI Assistant" },
    {
      text: mode === 'login' ? "Log into ChohanGenAI to get started" : "Sign up for ChohanGenAI to get started",
      isFinal: true,
    },
  ], [mode]);

  useEffect(() => {
    // Animation logic remains the same
    const currentConfig = phraseConfigurations[currentPhraseConfigIndex];
    if (!currentConfig) return;
    if (isPausedForAnimation) return;

    let animationStepTimeoutId: NodeJS.Timeout | undefined;

    if (!isDeleting) { 
      if (charIndex < currentConfig.text.length) {
        animationStepTimeoutId = setTimeout(() => {
          setDisplayedText(currentConfig.text.substring(0, charIndex + 1));
          setCharIndex(charIndex + 1);
        }, TYPING_SPEED);
      } else { 
        if (currentConfig.isFinal) return; 
        setIsPausedForAnimation(true); 
        setTimeout(() => { setIsDeleting(true); setIsPausedForAnimation(false); }, PAUSE_DURATION_AFTER_TYPING);
      }
    } else { 
      if (charIndex > 0) {
        animationStepTimeoutId = setTimeout(() => {
          setDisplayedText(currentConfig.text.substring(0, charIndex - 1));
          setCharIndex(charIndex - 1);
        }, DELETING_SPEED);
      } else { 
        setIsPausedForAnimation(true); 
        setTimeout(() => {
          setIsDeleting(false);
          setCurrentPhraseConfigIndex(prev => prev + 1 < phraseConfigurations.length ? prev + 1 : prev);
          setIsPausedForAnimation(false); 
        }, PAUSE_DURATION_BEFORE_NEXT_PHRASE);
      }
    }

    return () => { if (animationStepTimeoutId) clearTimeout(animationStepTimeoutId); };
  }, [charIndex, isDeleting, currentPhraseConfigIndex, phraseConfigurations, isPausedForAnimation]);

  const formSchema = mode === 'signup' ? signupSchema : loginSchema;

  const form = useForm<SignupFormData | LoginFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });
  
  const otpForm = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: '' },
  });


  const handleCredentialSubmit = async (data: SignupFormData | LoginFormData) => {
    setIsSubmitting(true);
    setAuthStatus('pending');
    
    if (mode === 'signup') {
        const result = await signup(data as SignupFormData);
        if (result.success) {
            setAuthStatus('success');
            setEmailForOtp(data.email);
            setAuthStep('otp');
            otpForm.reset({ otp: '' }); // Clear OTP form
            if (result.needsVerification) {
                form.setError('email', { type: 'manual', message: 'This email is pending verification. Check your inbox for an OTP.' });
            }
        } else {
            setAuthStatus('error');
             setTimeout(() => setAuthStatus('idle'), 2000);
        }
    } else {
        const success = await login(data as LoginFormData);
        if (success) {
            setAuthStatus('success');
            setEmailForOtp(data.email);
            setAuthStep('otp');
            otpForm.reset({ otp: '' }); // Clear OTP form
        } else {
            setAuthStatus('error');
            setTimeout(() => setAuthStatus('idle'), 2000);
        }
    }
    
    setIsSubmitting(false);
  };
  
  const handleOtpSubmit = async (data: OtpFormData) => {
    setIsSubmitting(true);
    setAuthStatus('pending');
    
    const success = await verifyOtpAndLogin({ email: emailForOtp, otp: data.otp });

    if (success) {
      setAuthStatus('success');
      // Redirect will be handled by AuthContext
    } else {
      setAuthStatus('error');
      otpForm.setError('otp', { type: 'manual', message: 'Invalid or expired OTP.' });
      setTimeout(() => {
        setAuthStatus('idle');
      }, 2000);
    }
    setIsSubmitting(false);
  };

  const handleResendOtp = async () => {
    setIsSubmitting(true);
    await resendOtp(emailForOtp);
    setIsSubmitting(false);
  }

  const currentPhraseIsDoneAndFinal = 
    phraseConfigurations[currentPhraseConfigIndex]?.isFinal && 
    charIndex === phraseConfigurations[currentPhraseConfigIndex]?.text.length;


  if (authStep === 'otp') {
    return (
      <Card className="w-full max-w-sm shadow-2xl border-border/50">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary text-center">Enter Verification Code</CardTitle>
          <CardDescription className="text-center pt-2">
            A 6-digit OTP has been sent to <br/> <span className="font-semibold text-primary">{emailForOtp}</span>
          </CardDescription>
        </CardHeader>
        <Form {...otpForm}>
          <form onSubmit={otpForm.handleSubmit(handleOtpSubmit)}>
            <CardContent className="space-y-6">
              <FormField
                control={otpForm.control}
                name="otp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>One-Time Password</FormLabel>
                    <FormControl>
                       <Input placeholder="_ _ _ _ _ _" {...field} disabled={isSubmitting} maxLength={6} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                 {authStatus === 'pending' ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...</> : 'Verify & Login'}
              </Button>
               <div className="flex justify-between w-full">
                <Button type="button" variant="link" onClick={() => setAuthStep('credentials')} disabled={isSubmitting} className="p-1 text-sm">
                    <ArrowLeft className="mr-1 h-4 w-4"/> Go Back
                </Button>
                <Button type="button" variant="link" onClick={handleResendOtp} disabled={isSubmitting} className="p-1 text-sm">
                    Resend OTP
                </Button>
               </div>
            </CardFooter>
          </form>
        </Form>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-sm shadow-2xl border-border/50">
       <CardHeader>
        <CardTitle 
            className="text-3xl font-bold text-primary flex items-center justify-center h-16 sm:h-20" 
            aria-live="polite"
        >
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
        </CardTitle>
        <CardDescription className="text-center pt-2">
          {mode === 'login' ? 'Log in to continue to ChohanGenAI.' : 'Enter your details to get started.'}
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleCredentialSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="you@example.com" {...field} disabled={isSubmitting} />
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
                  Redirecting...
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
