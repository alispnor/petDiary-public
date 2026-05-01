import axios from "axios";
import { useAppStore } from "../store/useAppStore";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000/api/v1";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const { token, language } = useAppStore.getState();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  config.headers["Accept-Language"] = language;

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Token expirado/inválido: desloga (interceptor não precisa mostrar
    // alerta — RootStack troca pra Login automaticamente)
    if (error.response?.status === 401) {
      useAppStore.getState().logout();
    }
    // Network errors (timeout, sem internet, DNS): error.response é
    // undefined. Não derruba a UI; cada caller decide se mostra Alert.
    // Logamos para diagnóstico.
    if (!error.response) {
      // eslint-disable-next-line no-console
      console.warn("[api] network error:", error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
