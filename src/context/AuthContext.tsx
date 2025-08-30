
'use client';

import type React from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { ref, get, set, update } from "firebase/database";

// Interface for the full user data stored with password
interface User {
  username: string; // Fixed identifier, used for login
  password?: string; // Only for storage, not for currentUser state directly
  nickname?: string; // Display name, changeable
  mobileNumber?: string;
  email?: string;
  pfpUrl?: string;
}

// Interface for the currentUser state and public profile view
export interface UserProfile {
  username: string; // Fixed identifier
  nickname?: string; // Display name, changeable
  mobileNumber?: string;
  email?: string;
  pfpUrl?: string;
}

// Type for profile update data; username is not updatable
export type UserProfileUpdate = Omit<Partial<UserProfile>, 'username'>;


interface AuthContextType {
  currentUser: UserProfile | null;
  isLoading: boolean;
  signup: (userData: Pick<User, 'username' | 'password'>) => Promise<boolean>; // Signup only needs username/password initially
  login: (userData: Pick<User, 'username' | 'password'>) => Promise<boolean>;
  logout: () => void;
  updateUserProfile: (profileData: UserProfileUpdate) => Promise<boolean>;
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

  const signup = useCallback(async (userData: Pick<User, 'username' | 'password'>): Promise<boolean> => {
    if (!userData.password || userData.password.length < 6 || userData.password.length > 18) {
      toast({
        variant: 'destructive',
        title: 'Signup Failed',
        description: 'Password must be between 6 and 18 characters.',
      });
      return false;
    }

    const userRef = ref(db, `users/${userData.username}`);
    const userSnapshot = await get(userRef);

    if (userSnapshot.exists()) {
      toast({
        variant: 'destructive',
        title: 'Signup Failed',
        description: 'Username already taken. Please choose another.',
      });
      return false;
    }

    const newUserForStorage: User = {
        username: userData.username,
        password: userData.password, // In a real app, this should be hashed!
        nickname: userData.username,
        mobileNumber: '',
        email: '',
        pfpUrl: '',
    };
    
    try {
        await set(userRef, newUserForStorage);
    } catch (error) {
        console.error("Error creating user in Realtime DB: ", error);
        toast({
            variant: 'destructive',
            title: 'Signup Failed',
            description: 'Could not create your account. Please try again.',
        });
        return false;
    }

    const userProfile: UserProfile = {
        username: newUserForStorage.username,
        nickname: newUserForStorage.nickname,
        mobileNumber: newUserForStorage.mobileNumber,
        email: newUserForStorage.email,
        pfpUrl: newUserForStorage.pfpUrl,
    };
    setCurrentUser(userProfile);
    localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(userProfile));
    
    toast({
      title: 'Signup Successful',
      description: `Welcome, ${userProfile.nickname || userProfile.username}!`,
    });
    router.push('/');
    return true;
  }, [router, toast]);

  const login = useCallback(async (userData: Pick<User, 'username' | 'password'>): Promise<boolean> => {
    const userRef = ref(db, `users/${userData.username}`);
    
    try {
        const userSnapshot = await get(userRef);

        if (!userSnapshot.exists() || userSnapshot.val().password !== userData.password) {
          toast({
            variant: 'destructive',
            title: 'Login Failed',
            description: 'Invalid username or password.',
          });
          return false;
        }

        const user = userSnapshot.val() as User;
        const userProfile: UserProfile = {
            username: user.username,
            nickname: user.nickname || user.username,
            mobileNumber: user.mobileNumber || '',
            email: user.email || '',
            pfpUrl: user.pfpUrl || '',
        };
        setCurrentUser(userProfile);
        localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(userProfile));
        
        toast({
          title: 'Login Successful',
          description: `Welcome back, ${userProfile.nickname || userProfile.username}!`,
        });
        router.push('/');
        return true;

    } catch(error) {
        console.error("Error logging in: ", error);
         toast({
            variant: 'destructive',
            title: 'Login Failed',
            description: 'An error occurred during login. Please try again.',
        });
        return false;
    }
  }, [router, toast]);

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
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to update your profile.' });
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


  return (
    <AuthContext.Provider value={{ currentUser, isLoading, signup, login, logout, updateUserProfile }}>
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
