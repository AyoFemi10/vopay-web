// src/stores/profileStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ProfileType = 'PERSONAL' | 'BUSINESS' | 'DEVELOPER';

export interface Profile {
  id: string;
  type: ProfileType;
  displayName: string;
  businessName?: string | null;
  vpxAccountNumber: string;
  username?: string | null;
  isDefault: boolean;
  isActive: boolean;
}

type ProfileState = {
  profiles: Profile[];
  activeProfile: Profile | null;

  setProfiles: (profiles: Profile[]) => void;
  setActiveProfile: (profile: Profile | null) => void;
  switchProfile: (profileId: string) => void;
  clearProfiles: () => void;
};

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      profiles: [],
      activeProfile: null,

      setProfiles: (profiles) => {
        const current = get().activeProfile;
        // Keep active profile if it still exists, otherwise default to first active/default
        const stillExists = current
          ? profiles.find((p) => p.id === current.id)
          : null;
        const activeProfile =
          stillExists ??
          profiles.find((p) => p.isDefault) ??
          profiles[0] ??
          null;
        set({ profiles, activeProfile });
      },

      setActiveProfile: (profile) => set({ activeProfile: profile }),

      switchProfile: (profileId) => {
        const profile = get().profiles.find((p) => p.id === profileId);
        if (profile) set({ activeProfile: profile });
      },

      clearProfiles: () => set({ profiles: [], activeProfile: null }),
    }),
    { name: 'profile-store' }
  )
);
