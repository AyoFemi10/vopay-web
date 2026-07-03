'use client';

import { createContext, useContext, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { useProfileStore } from '@/stores/profileStore';
import type { UserPublic } from '@/types/shared';

interface AuthContextType {
  user: UserPublic | null;
  isLoading: boolean;
  logout: () => Promise<void>;
  updateUser: (data: Partial<UserPublic>) => void;
  /**
   * Call after a successful Supabase sign-in to provision the internal
   * VOPayX user profile and hydrate the auth store.
   */
  handleAuthCallback: (accessToken: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const user        = useAuthStore((s) => s.user);
  const isLoading   = useAuthStore((s) => s.isLoading);
  const setUser     = useAuthStore((s) => s.setUser);
  const setLoading  = useAuthStore((s) => s.setLoading);
  const clearAuth   = useAuthStore((s) => s.clearAuth);
  const clearProfiles = useProfileStore((s) => s.clearProfiles);

  // ── Session hydration on mount ─────────────────────────────────────────────
  // Listen to Supabase auth state changes. This fires on:
  //  - Initial load (INITIAL_SESSION)
  //  - Sign-in / sign-out / token-refresh events
  useEffect(() => {
    // Immediately mark as loading while we wait for the initial session
    setLoading(true);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!session) {
        clearAuth();
        clearProfiles();
        return;
      }

      // Fetch the VOPayX internal profile for the authenticated user
      try {
        const { data } = await apiClient.get('/auth/me');
        if (data?.success) {
          setUser(data.data);
        } else {
          clearAuth();
        }
      } catch {
        clearAuth();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Route guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isLoading) return;

    const isAuthRoute      = pathname.startsWith('/auth');
    const isProtectedRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/admin');

    if (isProtectedRoute && !user) {
      router.push('/auth/login');
    } else if (isAuthRoute && user) {
      router.push('/dashboard');
    }
  }, [isLoading, pathname, router, user]);

  // ── handleAuthCallback ─────────────────────────────────────────────────────
  // Called after a successful Supabase sign-in to provision the VOPayX
  // internal profile when needed and hydrate the auth store.
  const handleAuthCallback = async (accessToken: string) => {
    try {
      const { data } = await apiClient.post('/auth/callback', { accessToken });
      if (data?.success) {
        setUser(data.data.user);
        router.push('/dashboard');
      }
    } catch (err) {
      throw err; // re-throw so the calling page can show an error toast
    }
  };

  // ── logout ─────────────────────────────────────────────────────────────────
  const logout = async () => {
    try {
      // Notify the API (revokes other sessions)
      await apiClient.post('/auth/logout').catch(() => {});
    } finally {
      await supabase.auth.signOut();
      clearAuth();
      clearProfiles();
      router.push('/auth/login');
    }
  };

  const updateUser = (data: Partial<UserPublic>) => {
    if (user) setUser({ ...user, ...data });
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, logout, updateUser, handleAuthCallback }}>
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
