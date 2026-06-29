'use client';

import { createContext, useContext, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Cookies from 'js-cookie';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import type { UserPublic } from '@/types/shared';

interface AuthContextType {
  user: UserPublic | null;
  isLoading: boolean;
  login: (token: string, userData: UserPublic, expiresIn: number) => void;
  logout: () => Promise<void>;
  updateUser: (data: Partial<UserPublic>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);
  const setUser = useAuthStore((state) => state.setUser);
  const setLoading = useAuthStore((state) => state.setLoading);

  useEffect(() => {
    const token = Cookies.get('accessToken');
    if (!token) {
      setLoading(false);
      return;
    }

    const fetchUser = async () => {
      try {
        const { data } = await apiClient.get('/auth/me');
        if (data?.success) {
          setUser(data.data);
        } else {
          Cookies.remove('accessToken');
          setUser(null);
        }
      } catch (error) {
        console.error('Failed to fetch user session', error);
        Cookies.remove('accessToken');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [setLoading, setUser]);

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
  }, [isLoading, pathname, router, user]);

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
    } catch (error) {
      console.error('Logout API failed', error);
    } finally {
      Cookies.remove('accessToken');
      setUser(null);
      setLoading(false);
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
