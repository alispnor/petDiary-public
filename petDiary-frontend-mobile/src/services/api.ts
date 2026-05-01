import axios from "axios";
import { useAppStore } from "../store/useAppStore";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://192.168.10.203:8000/api/v1";

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
    if (error.response?.status === 401) {
      useAppStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export default api;
