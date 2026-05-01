import api from "./api";

export interface UsernameCheck {
  available: boolean;
  reason?: string;
}

export async function checkUsername(username: string): Promise<UsernameCheck> {
  if (username.length < 3) {
    return { available: false, reason: "too_short" };
  }
  try {
    const { data } = await api.get<UsernameCheck>("/auth/check-username/", {
      params: { username },
    });
    return data;
  } catch {
    // erro de rede — não bloqueia o usuário; backend revalida no submit
    return { available: true };
  }
}
