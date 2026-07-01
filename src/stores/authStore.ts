// src/stores/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserPublic } from '@/types/shared';

type AuthState = {
  user: UserPublic | null;
  accessToken: string | null;
  requires2FA: boolean;
  tempToken: string | null;
  isLoading: boolean;

  // Legacy setters kept for AuthContext compatibility
  setUser: (user: UserPublic | null) => void;
  setLoading: (loading: boolean) => void;

  // New unified setters
  setAuth: (user: UserPublic, accessToken: string) => void;
  setRequires2FA: (tempToken: string) => void;
  clearAuth: () => void;

  // Convenience computed
  isAuthenticated: boolean;

  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      requires2FA: false,
      tempToken: null,
      isLoading: true,
      isAuthenticated: false,

      setUser: (user) =>
        set({ user, isLoading: false, isAuthenticated: !!user }),

      setLoading: (isLoading) => set({ isLoading }),

      setAuth: (user, accessToken) =>
        set({
          user,
          accessToken,
          isAuthenticated: true,
          requires2FA: false,
          tempToken: null,
          isLoading: false,
        }),

      setRequires2FA: (tempToken) =>
        set({
          requires2FA: true,
          tempToken,
          isAuthenticated: false,
          isLoading: false,
        }),

      clearAuth: () =>
        set({
          user: null,
          accessToken: null,
          requires2FA: false,
          tempToken: null,
          isAuthenticated: false,
          isLoading: false,
        }),

      logout: () =>
        set({
          user: null,
          accessToken: null,
          requires2FA: false,
          tempToken: null,
          isAuthenticated: false,
          isLoading: false,
        }),
    }),
    { name: 'auth-store' }
  )
);
