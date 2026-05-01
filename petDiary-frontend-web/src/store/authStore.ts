import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type UserRole = "TUTOR" | "VET";

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: UserRole;
  crmv?: string;
}

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  // sessão de PIN (apenas para vet após claim)
  pin: string | null;
  revoked: boolean;

  setAuth: (token: string, refreshToken: string, user: AuthUser) => void;
  setUser: (user: AuthUser) => void;
  setPin: (pin: string) => void;
  revokeAccess: () => void;
  clearRevoked: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      user: null,
      pin: null,
      revoked: false,

      setAuth: (token, refreshToken, user) =>
        set({ token, refreshToken, user, revoked: false }),

      setUser: (user) => set({ user }),

      setPin: (pin) => set({ pin }),

      revokeAccess: () => set({ pin: null, revoked: true }),

      clearRevoked: () => set({ revoked: false }),

      logout: () =>
        set({
          token: null,
          refreshToken: null,
          user: null,
          pin: null,
          revoked: false,
        }),
    }),
    {
      name: "petdiary-auth",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
