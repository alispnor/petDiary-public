import axios from 'axios';
import { useAppStore } from '../store/useAppStore';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://api:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de request: injeta token e idioma
api.interceptors.request.use((config) => {
  const { user, language } = useAppStore.getState();

  if (user?.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }

  config.headers['Accept-Language'] = language;

  return config;
});

// Interceptor de response: trata 401
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
