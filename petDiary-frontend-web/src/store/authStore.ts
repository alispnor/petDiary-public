import { create } from "zustand";

interface AuthState {
  token: string | null;
  pin: string | null;
  revoked: boolean;
  setSession: (token: string, pin: string) => void;
  revokeAccess: () => void;
  clearRevoked: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  pin: null,
  revoked: false,

  setSession: (token, pin) => set({ token, pin, revoked: false }),

  revokeAccess: () => set({ token: null, pin: null, revoked: true }),

  clearRevoked: () => set({ revoked: false }),

  logout: () => set({ token: null, pin: null, revoked: false }),
}));
