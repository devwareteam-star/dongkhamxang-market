'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserPermissions } from '@/types';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  updateProfile: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Default permissions for different roles
const getDefaultPermissions = (role: User['role']): UserPermissions => {
  switch (role) {
    case 'manager': // Super Admin
      return {
        spaces: { read: true, write: true, delete: true },
        tenants: { read: true, write: true, delete: true },
        payments: { read: true, write: true, delete: true },
        reports: { read: true, write: true, delete: true },
        users: { read: true, write: true, delete: true }
      };
    case 'employee': // Market Manager
      return {
        spaces: { read: true, write: true, delete: false },
        tenants: { read: true, write: true, delete: false },
        payments: { read: true, write: true, delete: false },
        reports: { read: true, write: false, delete: false },
        users: { read: true, write: false, delete: false }
      };
    default:
      return {
        spaces: { read: true, write: false, delete: false },
        tenants: { read: true, write: false, delete: false },
        payments: { read: true, write: false, delete: false },
        reports: { read: true, write: false, delete: false },
        users: { read: false, write: false, delete: false }
      };
  }
};

// Simple user database with username/password
const USERS: Array<{
  username: string;
  password: string;
  userData: User;
}> = [
  {
    username: 'admin',
    password: 'admin123',
    userData: {
      userId: '1',
      id: '1',
      displayName: 'ຜູ້ຄຸ້ມຄອງສູງສຸດ',
      username: 'admin',
      name: 'ຜູ້ຄຸ້ມຄອງສູງສຸດ',
      role: 'manager',
      email: 'admin@dongkhamxang-market.com',
      phoneNumber: '+856 20 1234 5678',
      phone: '+856 20 1234 5678',
      permissions: getDefaultPermissions('manager'),
      isActive: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date(),
      lastLogin: new Date()
    }
  },
  {
    username: 'manager',
    password: 'manager123',
    userData: {
      userId: '2',
      id: '2',
      displayName: 'ວິໄຊ ລາວົງ',
      username: 'manager',
      name: 'ວິໄຊ ລາວົງ',
      role: 'manager',
      email: 'manager@dongkhamxang-market.com',
      phoneNumber: '+856 20 2345 6789',
      phone: '+856 20 2345 6789',
      permissions: getDefaultPermissions('manager'),
      isActive: true,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date(),
      lastLogin: new Date()
    }
  },
  {
    username: 'staff',
    password: 'staff123',
    userData: {
      userId: '3',
      id: '3',
      displayName: 'ສົມໃຈ ຈັນທະວົງ',
      username: 'staff',
      name: 'ສົມໃຈ ຈັນທະວົງ',
      role: 'employee',
      email: 'staff@dongkhamxang-market.com',
      phoneNumber: '+856 20 3456 7890',
      phone: '+856 20 3456 7890',
      permissions: getDefaultPermissions('employee'),
      isActive: true,
      createdAt: new Date('2024-02-01'),
      updatedAt: new Date(),
      lastLogin: new Date()
    }
  }
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for saved user in localStorage
    const savedUser = localStorage.getItem('market_user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        // Ensure saved user has all required fields
        const completeUser: User = {
          ...userData,
          createdAt: userData.createdAt ? new Date(userData.createdAt) : new Date(),
          updatedAt: userData.updatedAt ? new Date(userData.updatedAt) : new Date(),
          lastLogin: userData.lastLogin ? new Date(userData.lastLogin) : new Date()
        };
        setUser(completeUser);
      } catch (error) {
        console.error('Error parsing saved user data:', error);
        localStorage.removeItem('market_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Find user with matching credentials
    const foundUser = USERS.find(u => 
      u.username === username && 
      u.password === password &&
      u.userData.isActive
    );
    
    if (foundUser) {
      const updatedUser: User = { 
        ...foundUser.userData,
        lastLogin: new Date(),
        updatedAt: new Date()
      };
      
      setUser(updatedUser);
      localStorage.setItem('market_user', JSON.stringify(updatedUser));
      setIsLoading(false);
      return true;
    }
    
    setIsLoading(false);
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('market_user');
  };

  const updateProfile = (data: Partial<User>) => {
    if (user) {
      const updatedUser: User = { 
        ...user, 
        ...data,
        updatedAt: new Date()
      };
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