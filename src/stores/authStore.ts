import { create } from 'zustand';
import type { UserPublic } from '@/types/shared';

// NOTE: We no longer persist auth state in localStorage. Supabase manages
// the session in its own storage. The store is ephemeral — it holds the
// hydrated VOPayX user profile in memory for the current page session.

type AuthState = {
  user: UserPublic | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  setUser: (user: UserPublic | null) => void;
  setLoading: (loading: boolean) => void;
  clearAuth: () => void;
};

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  setUser: (user) =>
    set({ user, isLoading: false, isAuthenticated: !!user }),

  setLoading: (isLoading) => set({ isLoading }),

  clearAuth: () =>
    set({ user: null, isAuthenticated: false, isLoading: false }),
}));
