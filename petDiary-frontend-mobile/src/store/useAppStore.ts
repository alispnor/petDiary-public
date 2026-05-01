import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AppState } from "../types";

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      activePet: null,
      language: "pt-BR",

      setAuth: (token, refreshToken, user) =>
        set({ token, refreshToken, user }),

      setActivePet: (pet) => set({ activePet: pet }),

      setLanguage: (language) => set({ language }),

      logout: () =>
        set({
          user: null,
          token: null,
          refreshToken: null,
          activePet: null,
        }),
    }),
    {
      name: "petdiary-mobile-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
