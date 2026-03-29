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
instance.interceptors.request.use(async (config) => {
  const { useAuthStore }    = await import('@/store/auth.store');
  const { useCompanyStore } = await import('@/store/company.store');

  const userToken    = useAuthStore.getState().accessToken;
  const companyToken = useCompanyStore.getState().accessToken;

  const token = companyToken ?? userToken;

  if (token) config.headers.Authorization = `Bearer ${token}`;

  return config;
});

// ─── Response interceptor — silent token refresh ──────────────────────────────
instance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetryConfig;

    if (
      error.response?.status === 401 &&
      !original._retry &&
      !original.url?.includes('/refresh')
    ) {
      original._retry = true;

      try {
        const { useAuthStore }    = await import('@/store/auth.store');
        const { useCompanyStore } = await import('@/store/company.store');

        const userStore    = useAuthStore.getState();
        const companyStore = useCompanyStore.getState();

        const isCompany = !!companyStore.accessToken;

        const refreshRoute = isCompany
          ? '/api/company/refresh'
          : '/api/auth/refresh';

        const { data } = await axios.post(
          refreshRoute,
          {},
          { withCredentials: true }
        );

        const newToken: string = data.data.accessToken;

        if (isCompany) {
          companyStore.setToken(newToken);
        } else {
          userStore.setToken(newToken);
        }

        original.headers.Authorization = `Bearer ${newToken}`;

        return instance(original);
      } catch {
        const { useAuthStore }    = await import('@/store/auth.store');
        const { useCompanyStore } = await import('@/store/company.store');

        useAuthStore.getState().clearAuth();
        useCompanyStore.getState().clearAuth();

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
