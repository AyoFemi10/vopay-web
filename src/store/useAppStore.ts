import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type UIState = {
  /** dark mode flag */
  darkMode: boolean;
  /** toggle dark mode */
  toggleDarkMode: () => void;
  /** sidebar open/close */
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  /** optional modal state */
  modalOpen: boolean;
  setModalOpen: (open: boolean) => void;
};

export const useAppStore = create<UIState>()(
  persist(
    (set, get) => ({
      darkMode: false,
      toggleDarkMode: () => set({ darkMode: !get().darkMode }),
      sidebarOpen: false,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      modalOpen: false,
      setModalOpen: (open) => set({ modalOpen: open }),
    }),
    { name: 'vopay-ui-store' }
  )
);
