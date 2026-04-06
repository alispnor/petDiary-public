import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppState } from '../types';

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      activePet: null,
      language: 'pt-BR',

      setUser: (user) => set({ user }),

      setActivePet: (pet) => set({ activePet: pet }),

      setLanguage: (language) => set({ language }),

      logout: () => set({ user: null, activePet: null }),
    }),
    {
      name: 'petdiary-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        activePet: state.activePet,
        language: state.language,
      }),
    }
  )
);
