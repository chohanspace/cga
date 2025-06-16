
'use client';

import type React from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface User {
  username: string;
  password?: string; // Password stored for demo, NOT secure for production
}

interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  signup: (userData: User) => Promise<boolean>;
  login: (userData: User) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USERS_STORAGE_KEY = 'chat_app_users';
const CURRENT_USER_STORAGE_KEY = 'chat_app_current_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
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
    } catch (error) {
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

    // In a real app, hash the password here before saving
    const newUser = { username: userData.username, password: userData.password };
    saveUsers([...users, newUser]);
    setCurrentUser({ username: newUser.username }); // Don't store password in currentUser state
    try {
      localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify({ username: newUser.username }));
    } catch (error) {
      console.error("Failed to save current user to localStorage", error);
    }
    toast({
      title: 'Signup Successful',
      description: `Welcome, ${newUser.username}!`,
    });
    router.push('/');
    return true;
  }, [getUsers, saveUsers, router, toast]);

  const login = useCallback(async (userData: User): Promise<boolean> => {
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
    
    setCurrentUser({ username: user.username });
    try {
      localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify({ username: user.username }));
    } catch (error) {
      console.error("Failed to save current user to localStorage", error);
    }
    toast({
      title: 'Login Successful',
      description: `Welcome back, ${user.username}!`,
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

  return (
    <AuthContext.Provider value={{ currentUser, isLoading, signup, login, logout }}>
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
