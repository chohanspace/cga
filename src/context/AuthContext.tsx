
'use client';

import type React from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { ref, get, set, update, child } from "firebase/database";

// Interface for the full user data stored with password
interface User {
  username: string; // The part of the email before the @
  password?: string; // In a real app, this MUST be hashed!
  email: string; // Full email address
  nickname?: string; 
  mobileNumber?: string;
  pfpUrl?: string;
  otp?: string; // One-Time Password
  otpExpires?: number; // OTP expiry timestamp
}

// Interface for the currentUser state and public profile view
export interface UserProfile {
  username: string; // The part of the email before the @
  email: string; // Full email address
  nickname?: string; 
  mobileNumber?: string;
  pfpUrl?: string;
}

// Type for profile update data; username is not updatable
export type UserProfileUpdate = Omit<Partial<UserProfile>, 'username' | 'email'>;


interface AuthContextType {
  currentUser: UserProfile | null;
  isLoading: boolean;
  signup: (userData: Pick<User, 'email' | 'password'>) => Promise<boolean>;
  login: (userData: Pick<User, 'email' | 'password'>) => Promise<boolean>;
  logout: () => void;
  updateUserProfile: (profileData: UserProfileUpdate) => Promise<boolean>;
  verifyOtpAndLogin: (otpData: { email: string, otp: string }) => Promise<boolean>;
  resendOtp: (email: string) => Promise<void>;
  listUserChats: () => Promise<string[]>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CURRENT_USER_STORAGE_KEY = 'chat_app_current_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
      if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to load user from localStorage", error);
    }
    setIsLoading(false);
  }, []);

  const sendOtpRequest = async (email: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send OTP');
      }
      toast({
        title: 'Verification Code Sent',
        description: `An OTP has been sent to ${email}.`,
      });
      return true;
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'OTP Error',
        description: error.message || 'Could not send verification code.',
      });
      return false;
    }
  };


  const signup = useCallback(async (userData: Pick<User, 'email' | 'password'>): Promise<boolean> => {
    const { email, password } = userData;
    if (!password || password.length < 6 || password.length > 18) {
      toast({
        variant: 'destructive',
        title: 'Signup Failed',
        description: 'Password must be between 6 and 18 characters.',
      });
      return false;
    }
    if (!email || !email.includes('@')) {
        toast({ variant: 'destructive', title: 'Signup Failed', description: 'Please provide a valid email.'});
        return false;
    }

    const username = email.split('@')[0];
    const userRef = ref(db, `users/${username}`);
    const userSnapshot = await get(userRef);

    if (userSnapshot.exists()) {
      toast({ variant: 'destructive', title: 'Signup Failed', description: 'An account with this email already exists.' });
      return false;
    }

    const newUserForStorage: User = {
        username,
        email,
        password: password, // In a real app, this should be hashed!
        nickname: username,
        mobileNumber: '',
        pfpUrl: '',
    };
    
    try {
        await set(userRef, newUserForStorage);
        // Do not log in yet, just send OTP
        return await sendOtpRequest(email);
    } catch (error) {
        console.error("Error creating user in Realtime DB: ", error);
        toast({ variant: 'destructive', title: 'Signup Failed', description: 'Could not create your account.' });
        return false;
    }
  }, [toast]);

  const login = useCallback(async (userData: Pick<User, 'email' | 'password'>): Promise<boolean> => {
    const { email, password } = userData;
    const username = email.split('@')[0];
    const userRef = ref(db, `users/${username}`);
    
    try {
        const userSnapshot = await get(userRef);

        if (!userSnapshot.exists() || userSnapshot.val().password !== password) {
          toast({ variant: 'destructive', title: 'Login Failed', description: 'Invalid email or password.' });
          return false;
        }

        // Password is correct, now send OTP
        return await sendOtpRequest(email);
    } catch(error) {
        console.error("Error during login credential check: ", error);
         toast({ variant: 'destructive', title: 'Login Failed', description: 'An error occurred during login.' });
        return false;
    }
  }, [toast]);
  
  const verifyOtpAndLogin = useCallback(async ({ email, otp }: { email: string, otp: string }): Promise<boolean> => {
    const username = email.split('@')[0];
    const userRef = ref(db, `users/${username}`);

    try {
      const userSnapshot = await get(userRef);
      if (!userSnapshot.exists()) {
        toast({ variant: 'destructive', title: 'Verification Failed', description: 'User not found.' });
        return false;
      }
      
      const user = userSnapshot.val() as User;
      if (user.otp !== otp || (user.otpExpires && user.otpExpires < Date.now())) {
        toast({ variant: 'destructive', title: 'Verification Failed', description: 'Invalid or expired OTP.' });
        return false;
      }
      
      // OTP is correct. Log the user in.
      const userProfile: UserProfile = {
          username: user.username,
          email: user.email,
          nickname: user.nickname || user.username,
          mobileNumber: user.mobileNumber || '',
          pfpUrl: user.pfpUrl || '',
      };
      setCurrentUser(userProfile);
      localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(userProfile));
      
      // Clear OTP from database after successful login
      await update(userRef, { otp: null, otpExpires: null });

      toast({
        title: 'Login Successful',
        description: `Welcome, ${userProfile.nickname || userProfile.username}!`,
      });
      router.push('/');
      return true;

    } catch (error) {
      console.error("Error verifying OTP: ", error);
      toast({ variant: 'destructive', title: 'Verification Error', description: 'An error occurred.' });
      return false;
    }
  }, [router, toast]);
  
  const resendOtp = useCallback(async (email: string) => {
    if (!email) return;
    await sendOtpRequest(email);
  }, [toast]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
    router.push('/auth/login');
    toast({
      title: 'Logged Out',
      description: 'You have been successfully logged out.',
    });
  }, [router, toast]);

  const updateUserProfile = useCallback(async (profileData: UserProfileUpdate): Promise<boolean> => {
    if (!currentUser) {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
        return false;
    }

    const userRef = ref(db, `users/${currentUser.username}`);
    
    const newNickname = profileData.nickname !== undefined 
      ? (profileData.nickname.trim() === '' ? currentUser.username : profileData.nickname) 
      : currentUser.nickname;
      
    const profileUpdateData = {
        ...profileData,
        nickname: newNickname
    };

    try {
        await update(userRef, profileUpdateData);
    } catch(error) {
        console.error("Error updating profile: ", error);
        toast({ variant: 'destructive', title: 'Update Failed', description: 'Could not update your profile.' });
        return false;
    }

    const updatedCurrentUserProfile: UserProfile = {
      ...currentUser,
      ...profileUpdateData,
    };

    setCurrentUser(updatedCurrentUserProfile);
    localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(updatedCurrentUserProfile));
    
    toast({
        title: 'Profile Updated',
        description: 'Your profile details have been saved.',
    });
    return true;
  }, [currentUser, toast]);
  
  const listUserChats = useCallback(async (): Promise<string[]> => {
    if (!currentUser) return [];
    try {
      const chatsRef = ref(db, `chats/${currentUser.username}`);
      const snapshot = await get(chatsRef);
      if (snapshot.exists()) {
        return Object.keys(snapshot.val());
      }
      return [];
    } catch (error) {
      console.error("Error listing user chats:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not load saved chats.' });
      return [];
    }
  }, [currentUser, toast]);


  return (
    <AuthContext.Provider value={{ currentUser, isLoading, signup, login, logout, updateUserProfile, verifyOtpAndLogin, resendOtp, listUserChats }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
