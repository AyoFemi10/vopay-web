'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, fetchUser, logout } = useAuthStore();

  // Initial fetch of user session
  useEffect(() => {
    fetchUser();
  }, []);

  // Route protection logic
  useEffect(() => {
    if (!isLoading) {
      const isAuthRoute = pathname.startsWith('/auth');
      const isProtectedRoute = pathname.startsWith('/dashboard');

      if (isProtectedRoute && !user) {
        router.push('/auth/login');
      } else if (isAuthRoute && user) {
        router.push('/dashboard');
      }
    }
  }, [user, isLoading, pathname, router]);

  // Provide same context shape for backward compatibility
  const contextValue = {
    user,
    isLoading,
    login: useAuthStore.getState().login,
    logout,
    updateUser: useAuthStore.getState().updateUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

// Backward compatible Context (optional, can be removed later)
import { createContext, useContext } from 'react';
import type { UserPublic } from '@vopay/shared';

interface AuthContextType {
  user: UserPublic | null;
  isLoading: boolean;
  login: (token: string, userData: UserPublic, expiresIn: number) => void;
  logout: () => Promise<void>;
  updateUser: (data: Partial<UserPublic>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Cookies from 'js-cookie';
import { apiClient } from '@/lib/api';
import type { UserPublic } from '@vopay/shared';

interface AuthContextType {
  user: UserPublic | null;
  isLoading: boolean;
  login: (token: string, userData: UserPublic, expiresIn: number) => void;
  logout: () => Promise<void>;
  updateUser: (data: Partial<UserPublic>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserPublic | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const fetchUser = async () => {
      const token = Cookies.get('accessToken');
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const { data } = await apiClient.get('/auth/me');
        if (data.success) {
          setUser(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch user session', error);
        Cookies.remove('accessToken');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  // Protected route logic
  useEffect(() => {
    if (!isLoading) {
      const isAuthRoute = pathname.startsWith('/auth');
      const isProtectedRoute = pathname.startsWith('/dashboard');

      if (isProtectedRoute && !user) {
        router.push('/auth/login');
      } else if (isAuthRoute && user) {
        router.push('/dashboard');
      }
    }
  }, [user, isLoading, pathname, router]);

  const login = (token: string, userData: UserPublic, expiresIn: number) => {
    Cookies.set('accessToken', token, {
      expires: expiresIn / 86400,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    setUser(userData);
    router.push('/dashboard');
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (e) {
      console.error('Logout API failed', e);
    } finally {
      Cookies.remove('accessToken');
      setUser(null);
      router.push('/auth/login');
    }
  };

  const updateUser = (data: Partial<UserPublic>) => {
    if (user) {
      setUser({ ...user, ...data });
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
