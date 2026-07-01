'use client';

import { createContext, useContext, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Cookies from 'js-cookie';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { useProfileStore } from '@/stores/profileStore';
import type { UserPublic } from '@/types/shared';

interface AuthContextType {
  user: UserPublic | null;
  isLoading: boolean;
  requires2FA: boolean;
  login: (token: string, userData: UserPublic, expiresIn: number) => void;
  logout: () => Promise<void>;
  updateUser: (data: Partial<UserPublic>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const requires2FA = useAuthStore((s) => s.requires2FA);
  const setUser = useAuthStore((s) => s.setUser);
  const setLoading = useAuthStore((s) => s.setLoading);
  const setAuth = useAuthStore((s) => s.setAuth);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const clearProfiles = useProfileStore((s) => s.clearProfiles);

  // Rehydrate session from cookie on mount
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
      } catch {
        Cookies.remove('accessToken');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [setLoading, setUser]);

  // Client-side route guard (server-side also handled by middleware.ts)
  useEffect(() => {
    if (!isLoading) {
      const isAuthRoute = pathname.startsWith('/auth');
      const isProtectedRoute =
        pathname.startsWith('/dashboard') || pathname.startsWith('/admin');

      if (isProtectedRoute && !user) {
        router.push('/auth/login');
      } else if (isAuthRoute && user && !requires2FA) {
        router.push('/dashboard');
      }
    }
  }, [isLoading, pathname, router, user, requires2FA]);

  const login = (token: string, userData: UserPublic, expiresIn: number) => {
    Cookies.set('accessToken', token, {
      expires: expiresIn / 86400,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    setAuth(userData, token);
    router.push('/dashboard');
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // ignore — we clear state regardless
    } finally {
      Cookies.remove('accessToken');
      clearAuth();
      clearProfiles();
      router.push('/auth/login');
    }
  };

  const updateUser = (data: Partial<UserPublic>) => {
    if (user) setUser({ ...user, ...data });
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading, requires2FA, login, logout, updateUser }}
    >
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
