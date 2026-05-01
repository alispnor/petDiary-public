import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  dynamicAuthStorage,
  isKeepLogged as readKeepLogged,
  migrateAuthStorage,
  setKeepLogged as writeKeepLogged,
} from "./dynamicStorage";

const AUTH_STORAGE_KEY = "petdiary-auth";

export type UserRole = "TUTOR" | "VET" | "ADMIN";

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: UserRole;
  crmv?: string;
  clinic_name?: string;
  must_change_password?: boolean;
}

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  // sessão de PIN (apenas para vet após claim)
  pin: string | null;
  revoked: boolean;
  // "manter conectado": true = localStorage, false = sessionStorage
  keepLogged: boolean;

  setAuth: (token: string, refreshToken: string, user: AuthUser) => void;
  setUser: (user: AuthUser) => void;
  setPin: (pin: string) => void;
  setKeepLogged: (keep: boolean) => void;
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
      keepLogged: readKeepLogged(),

      setAuth: (token, refreshToken, user) =>
        set({ token, refreshToken, user, revoked: false }),

      setUser: (user) => set({ user }),

      setPin: (pin) => set({ pin }),

      setKeepLogged: (keep) => {
        // migra a sessão entre localStorage e sessionStorage se necessário
        migrateAuthStorage(AUTH_STORAGE_KEY, keep);
        set({ keepLogged: keep });
      },

      revokeAccess: () => set({ pin: null, revoked: true }),

      clearRevoked: () => set({ revoked: false }),

      logout: () => {
        // logout não muda a preferência keepLogged — usuário pode querer
        // manter "manter conectado" marcado para o próximo login
        set({
          token: null,
          refreshToken: null,
          user: null,
          pin: null,
          revoked: false,
        });
        // remove explicitamente de ambos storages para garantir limpeza
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(AUTH_STORAGE_KEY);
          window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
        }
      },
    }),
    {
      name: AUTH_STORAGE_KEY,
      storage: createJSONStorage(() => dynamicAuthStorage),
      // não persiste a flag keepLogged dentro do estado (já vive em chave própria)
      partialize: (s) => ({
        token: s.token,
        refreshToken: s.refreshToken,
        user: s.user,
        pin: s.pin,
      }),
    }
  )
);

// Mantém a flag keepLogged sincronizada com window storage events
// (caso outra aba mude o valor)
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === "petdiary-keep-logged") {
      useAuthStore.setState({ keepLogged: readKeepLogged() });
    }
  });
}

// Wrapper exportado para uso direto (sem precisar do store)
export { writeKeepLogged };
