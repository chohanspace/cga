
'use client';

import type React from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

// Extended User interface
interface User {
  username: string; // This will be fixed after signup
  password?: string; // Only for storage, not for currentUser state directly
  nickname?: string; // This will be changeable
  mobileNumber?: string;
  email?: string;
  pfpUrl?: string;
}

// For currentUser state and profile updates, password is not included
export interface UserProfile {
  username: string; // Fixed identifier
  nickname?: string; // Display name, changeable
  mobileNumber?: string;
  email?: string;
  pfpUrl?: string;
}
// UserProfileUpdate will not include username
export type UserProfileUpdate = Omit<Partial<UserProfile>, 'username'>;


interface AuthContextType {
  currentUser: UserProfile | null;
  isLoading: boolean;
  signup: (userData: User) => Promise<boolean>;
  login: (userData: Pick<User, 'username' | 'password'>) => Promise<boolean>;
  logout: () => void;
  updateUserProfile: (profileData: UserProfileUpdate) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USERS_STORAGE_KEY = 'chat_app_users';
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

  const getUsers = useCallback((): User[] => {
    try {
      const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
      return storedUsers ? JSON.parse(storedUsers) : [];
    } catch (error) {
      console.error("Failed to load users from localStorage", error);
      return [];
    }
  }, []);

  const saveUsers = useCallback((users: User[]) => {
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    } catch (error)
      {
      console.error("Failed to save users to localStorage", error);
    }
  }, []);

  const signup = useCallback(async (userData: User): Promise<boolean> => {
    if (!userData.password || userData.password.length < 6 || userData.password.length > 18) {
      toast({
        variant: 'destructive',
        title: 'Signup Failed',
        description: 'Password must be between 6 and 18 characters.',
      });
      return false;
    }

    const users = getUsers();
    const existingUser = users.find(u => u.username === userData.username);

    if (existingUser) {
      toast({
        variant: 'destructive',
        title: 'Signup Failed',
        description: 'Username already taken. Please choose another.',
      });
      return false;
    }

    const newUser: User = {
        username: userData.username,
        password: userData.password,
        nickname: userData.nickname || userData.username, // Initialize nickname
        mobileNumber: userData.mobileNumber || '',
        email: userData.email || '',
        pfpUrl: userData.pfpUrl || '',
    };
    saveUsers([...users, newUser]);

    const userProfile: UserProfile = {
        username: newUser.username,
        nickname: newUser.nickname,
        mobileNumber: newUser.mobileNumber,
        email: newUser.email,
        pfpUrl: newUser.pfpUrl,
    };
    setCurrentUser(userProfile);
    try {
      localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(userProfile));
    } catch (error) {
      console.error("Failed to save current user to localStorage", error);
    }
    toast({
      title: 'Signup Successful',
      description: `Welcome, ${userProfile.nickname || userProfile.username}!`,
    });
    router.push('/');
    return true;
  }, [getUsers, saveUsers, router, toast]);

  const login = useCallback(async (userData: Pick<User, 'username' | 'password'>): Promise<boolean> => {
    const users = getUsers();
    const user = users.find(u => u.username === userData.username);

    if (!user || user.password !== userData.password) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: 'Invalid username or password.',
      });
      return false;
    }

    const userProfile: UserProfile = {
        username: user.username,
        nickname: user.nickname || user.username, // Use nickname or fallback to username
        mobileNumber: user.mobileNumber,
        email: user.email,
        pfpUrl: user.pfpUrl,
    };
    setCurrentUser(userProfile);
    try {
      localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(userProfile));
    } catch (error) {
      console.error("Failed to save current user to localStorage", error);
    }
    toast({
      title: 'Login Successful',
      description: `Welcome back, ${userProfile.nickname || userProfile.username}!`,
    });
    router.push('/');
    return true;
  }, [getUsers, router, toast]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    try {
      localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
    } catch (error) {
      console.error("Failed to remove current user from localStorage", error);
    }
    router.push('/auth/login');
    toast({
      title: 'Logged Out',
      description: 'You have been successfully logged out.',
    });
  }, [router, toast]);

  const updateUserProfile = useCallback(async (profileData: UserProfileUpdate): Promise<boolean> => {
    if (!currentUser) return false;

    const users = getUsers();
    const userToUpdateIndex = users.findIndex(u => u.username === currentUser.username);

    if (userToUpdateIndex === -1) {
        toast({ variant: 'destructive', title: 'Error', description: 'Original user not found for update.' });
        return false;
    }

    const updatedUser = {
        ...users[userToUpdateIndex],
        // Username and password are not changed here
        nickname: profileData.nickname !== undefined ? profileData.nickname : users[userToUpdateIndex].nickname,
        mobileNumber: profileData.mobileNumber !== undefined ? profileData.mobileNumber : users[userToUpdateIndex].mobileNumber,
        email: profileData.email !== undefined ? profileData.email : users[userToUpdateIndex].email,
        pfpUrl: profileData.pfpUrl !== undefined ? profileData.pfpUrl : users[userToUpdateIndex].pfpUrl,
    };

    const updatedUsers = [...users];
    updatedUsers[userToUpdateIndex] = updatedUser;
    saveUsers(updatedUsers);

    const updatedCurrentUserProfile: UserProfile = {
      username: currentUser.username, // Username remains the same
      nickname: updatedUser.nickname,
      mobileNumber: updatedUser.mobileNumber,
      email: updatedUser.email,
      pfpUrl: updatedUser.pfpUrl,
    };

    setCurrentUser(updatedCurrentUserProfile);
    try {
      localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(updatedCurrentUserProfile));
    } catch (error) {
      console.error("Failed to save updated current user to localStorage", error);
    }

    return true;
  }, [currentUser, getUsers, saveUsers, toast]);


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
