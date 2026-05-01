/**
 * Storage que delega entre localStorage (persistente) e sessionStorage
 * (temporário) com base na flag KEEP_LOGGED_KEY.
 *
 * Padrão de uso:
 *   - login com "manter conectado" marcado  → setKeepLogged(true)  → localStorage
 *   - login sem "manter conectado"          → setKeepLogged(false) → sessionStorage
 *
 * A flag é guardada FORA do estado persistido — em uma chave própria —
 * para resolver o problema circular: o storage precisa decidir onde
 * salvar antes do estado existir.
 */

import type { StateStorage } from "zustand/middleware";

const KEEP_LOGGED_KEY = "petdiary-keep-logged";

export const isKeepLogged = (): boolean => {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(KEEP_LOGGED_KEY) === "1";
};

export const setKeepLogged = (keep: boolean): void => {
  if (typeof window === "undefined") return;
  if (keep) {
    window.localStorage.setItem(KEEP_LOGGED_KEY, "1");
  } else {
    window.localStorage.removeItem(KEEP_LOGGED_KEY);
  }
};

const activeStorage = (): Storage => {
  if (typeof window === "undefined") {
    // SSR-safe stub (não usamos SSR aqui, mas evita crash em testes)
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      key: () => null,
      length: 0,
    } as Storage;
  }
  return isKeepLogged() ? window.localStorage : window.sessionStorage;
};

/**
 * Storage que SEMPRE escreve no storage ativo (decidido por isKeepLogged()),
 * mas LIMPA o outro para evitar duplicação.
 */
export const dynamicAuthStorage: StateStorage = {
  getItem: (name) => {
    if (typeof window === "undefined") return null;
    // Lê do ativo primeiro; fallback no outro (cobre transições)
    return (
      window.localStorage.getItem(name) ??
      window.sessionStorage.getItem(name)
    );
  },
  setItem: (name, value) => {
    if (typeof window === "undefined") return;
    const active = activeStorage();
    active.setItem(name, value);
    // remove do outro storage para não ficar resíduo
    const other =
      active === window.localStorage
        ? window.sessionStorage
        : window.localStorage;
    other.removeItem(name);
  },
  removeItem: (name) => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(name);
    window.sessionStorage.removeItem(name);
  },
};

/**
 * Migra o estado entre storages quando a flag muda durante a sessão
 * (caso o usuário marque/desmarque depois de já estar logado).
 */
export const migrateAuthStorage = (key: string, keep: boolean): void => {
  if (typeof window === "undefined") return;
  const fromStorage = keep ? window.sessionStorage : window.localStorage;
  const toStorage = keep ? window.localStorage : window.sessionStorage;
  const value = fromStorage.getItem(key);
  if (value !== null) {
    toStorage.setItem(key, value);
    fromStorage.removeItem(key);
  }
  setKeepLogged(keep);
};
