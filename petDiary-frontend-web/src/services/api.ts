import axios from "axios";
import { useAuthStore } from "../store/authStore";
import { logger } from "./logger";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const url = error.config?.url;
      const method = error.config?.method?.toUpperCase();

      logger.warn("http_error", {
        method,
        url,
        status,
        message: error.message,
      });

      if (status === 401) {
        useAuthStore.getState().logout();
      } else if (status === 403) {
        useAuthStore.getState().revokeAccess();
      }
    } else {
      logger.error("network_error", { message: String(error) });
    }
    return Promise.reject(error);
  }
);

export default api;
