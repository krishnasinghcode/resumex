import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';

interface RetryConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const instance = axios.create({
  baseURL:         import.meta.env.VITE_API_URL ?? '',
  withCredentials: true,
  headers:         { 'Content-Type': 'application/json' },
});

// ─── Request interceptor — inject access token ────────────────────────────────
// Import the store directly — Zustand is safe to import here because
// auth.store.ts does NOT import from axios.ts (only api files do)
// The circular dependency was a false concern — Zustand store has no axios import
instance.interceptors.request.use(async (config) => {
  const { useAuthStore } = await import('@/store/auth.store');
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Response interceptor — silent token refresh ──────────────────────────────
instance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetryConfig;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const { data } = await axios.post(
          '/api/auth/refresh',
          {},
          { withCredentials: true }
        );
        const newToken: string = data.data.accessToken;
        const { useAuthStore } = await import('@/store/auth.store');
        useAuthStore.getState().setToken(newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return instance(original);
      } catch {
        const { useAuthStore } = await import('@/store/auth.store');
        useAuthStore.getState().clearAuth();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default instance;

export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message ?? 'Something went wrong';
  }
  return 'Something went wrong';
};
