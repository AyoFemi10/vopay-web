// src/stores/authStore.ts
import create from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserPublic } from '@vopay/shared';

type AuthState = {
  user: UserPublic | null;
  isLoading: boolean;
  setUser: (user: UserPublic | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: true,
      setUser: (user) => set({ user, isLoading: false }),
      setLoading: (loading) => set({ isLoading: loading }),
      logout: async () => {
        try {
          // We'll call API elsewhere; just clear state here
          const { accessToken } = get();
        } finally {
          set({ user: null, isLoading: false });
        }
      },
    }),
    { name: 'auth-store' }
  )
);
