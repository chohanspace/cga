
'use client';

import type React from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

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

  const signup = useCallback(async (userData: Pick<User, 'username' | 'password'>): Promise<boolean> => {
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

    // Create the full User object for storage
    const newUserForStorage: User = {
        username: userData.username,
        password: userData.password,
        nickname: userData.username, // Default nickname to username
        mobileNumber: '',
        email: '',
        pfpUrl: '',
    };
    saveUsers([...users, newUserForStorage]);

    // Create the UserProfile for currentUser state and CURRENT_USER_STORAGE_KEY
    const userProfile: UserProfile = {
        username: newUserForStorage.username,
        nickname: newUserForStorage.nickname,
        mobileNumber: newUserForStorage.mobileNumber,
        email: newUserForStorage.email,
        pfpUrl: newUserForStorage.pfpUrl,
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

    // Create UserProfile from the stored User data
    const userProfile: UserProfile = {
        username: user.username,
        nickname: user.nickname || user.username, // Fallback to username if nickname isn't set
        mobileNumber: user.mobileNumber || '',
        email: user.email || '',
        pfpUrl: user.pfpUrl || '',
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
    if (!currentUser) {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to update your profile.' });
        return false;
    }

    const users = getUsers();
    const userToUpdateIndex = users.findIndex(u => u.username === currentUser.username);

    if (userToUpdateIndex === -1) {
        toast({ variant: 'destructive', title: 'Error', description: 'Original user not found for update.' });
        return false;
    }

    // Update the full User object in USERS_STORAGE_KEY
    const StoredUser = users[userToUpdateIndex];
    const updatedStoredUser: User = {
        ...StoredUser, // Keeps username and password
        nickname: profileData.nickname !== undefined ? (profileData.nickname.trim() === '' ? StoredUser.username : profileData.nickname) : StoredUser.nickname,
        mobileNumber: profileData.mobileNumber !== undefined ? profileData.mobileNumber : StoredUser.mobileNumber,
        email: profileData.email !== undefined ? profileData.email : StoredUser.email,
        pfpUrl: profileData.pfpUrl !== undefined ? profileData.pfpUrl : StoredUser.pfpUrl,
    };
    
    // If nickname is cleared, default it back to username
    if (updatedStoredUser.nickname === '') {
        updatedStoredUser.nickname = updatedStoredUser.username;
    }


    const updatedUsersArray = [...users];
    updatedUsersArray[userToUpdateIndex] = updatedStoredUser;
    saveUsers(updatedUsersArray);

    // Prepare the UserProfile for currentUser state and CURRENT_USER_STORAGE_KEY
    const updatedCurrentUserProfile: UserProfile = {
      username: currentUser.username, // Username remains the same, taken from current state
      nickname: updatedStoredUser.nickname,
      mobileNumber: updatedStoredUser.mobileNumber,
      email: updatedStoredUser.email,
      pfpUrl: updatedStoredUser.pfpUrl,
    };

    setCurrentUser(updatedCurrentUserProfile);
    try {
      localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(updatedCurrentUserProfile));
    } catch (error) {
      console.error("Failed to save updated current user to localStorage", error);
    }
    
    toast({
        title: 'Profile Updated',
        description: 'Your profile details have been saved.',
    });
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
