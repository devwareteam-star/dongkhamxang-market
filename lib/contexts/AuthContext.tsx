'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types';
import { onAuthStateChange, signIn as firebaseSignIn, signOutUser } from '@/lib/firebase/auth';
import { usersService } from '@/lib/firebase/firestore';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  updateProfile: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demo - in production this would come from Firebase
const DEMO_USERS: User[] = [
  {
    id: '1',
    username: 'admin',
    name: 'ผู้ดูแลระบบหลัก',
    role: 'admin',
    email: 'admin@dongkhamxang-market.firebaseapp.com',
    phone: '081-234-5678',
    createdAt: new Date('2024-01-01'),
    lastLogin: new Date(),
    isActive: true
  },
  {
    id: '2',
    username: 'employee1',
    name: 'นางสาวสมใจ ใจดี',
    role: 'employee',
    email: 'employee1@dongkhamxang-market.firebaseapp.com',
    phone: '082-345-6789',
    createdAt: new Date('2024-01-15'),
    lastLogin: new Date(),
    isActive: true
  }
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Listen to Firebase auth state changes
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get user data from Firestore
          const userData = await usersService.getById(firebaseUser.uid);
          if (userData) {
            // Convert Firebase Timestamps to JavaScript Dates
            const convertedUser = {
              ...userData,
              createdAt: userData.createdAt?.toDate ? userData.createdAt.toDate() : userData.createdAt,
              lastLogin: userData.lastLogin?.toDate ? userData.lastLogin.toDate() : userData.lastLogin
            } as User;
            setUser(convertedUser);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    // Check for saved user in localStorage (fallback for demo)
    const savedUser = localStorage.getItem('market_user');
    if (savedUser && !user) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
      } catch (error) {
        console.error('Error parsing saved user data:', error);
        localStorage.removeItem('market_user');
      }
    }
    
    if (!savedUser) {
      setIsLoading(false);
    }

    return () => unsubscribe();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Try Firebase authentication with email
      const email = username.includes('@') ? username : `${username}@dongkhamxang-market.firebaseapp.com`;
      const firebaseUser = await firebaseSignIn(email, password);
      
      if (firebaseUser) {
        // Get user data from Firestore
        const userData = await usersService.getById(firebaseUser.uid);
        if (userData) {
          // Convert Firebase Timestamps to JavaScript Dates
          const updatedUser = { 
            ...userData, 
            id: firebaseUser.uid,
            uid: firebaseUser.uid,
            lastLogin: new Date(),
            createdAt: userData.createdAt?.toDate ? userData.createdAt.toDate() : userData.createdAt
          } as User;
          setUser(updatedUser);
          await usersService.update(firebaseUser.uid, { lastLogin: new Date() });
          setIsLoading(false);
          return true;
        } else {
          // Create user document if it doesn't exist
          const newUserData = {
            uid: firebaseUser.uid,
            username: username,
            name: firebaseUser.displayName || username,
            role: username === 'admin' ? 'admin' as const : 'employee' as const,
            email: firebaseUser.email,
            phone: '',
            isActive: true
          };
          
          await usersService.create(newUserData, firebaseUser.uid);
          const createdUser = {
            ...newUserData,
            id: firebaseUser.uid,
            createdAt: new Date(),
            lastLogin: new Date()
          } as User;
          
          setUser(createdUser);
          setIsLoading(false);
          return true;
        }
      }
    } catch (error) {
      // Only log error if it's not an invalid credential error for demo users
      if (error instanceof Error && !error.message.includes('auth/invalid-credential')) {
        console.error('Firebase login error:', error);
      }
    }
    
    // Fallback to demo authentication
    const foundUser = DEMO_USERS.find(u => u.username === username && u.isActive);
    if (foundUser && password === 'password123') {
      const updatedUser = { ...foundUser, lastLogin: new Date() };
      setUser(updatedUser);
      localStorage.setItem('market_user', JSON.stringify(updatedUser));
      setIsLoading(false);
      return true;
    }
    
    setIsLoading(false);
    return false;
  };

  const logout = async () => {
    try {
      await signOutUser();
    } catch (error) {
      console.error('Logout error:', error);
    }
    setUser(null);
    localStorage.removeItem('market_user');
  };

  const updateProfile = (data: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...data };
      setUser(updatedUser);
      localStorage.setItem('market_user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};