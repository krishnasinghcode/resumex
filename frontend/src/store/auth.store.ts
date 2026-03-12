import { create } from 'zustand';
import type { User } from '@/types/auth.types';

interface AuthStore {
  accessToken:     string | null;
  user:            User | null;
  isAuthenticated: boolean;

  setAuth:   (token: string, user: User) => void;
  setToken:  (token: string) => void;
  setUser:   (user: User) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  accessToken:     null,
  user:            null,
  isAuthenticated: false,

  setAuth: (token, user) => set({ accessToken: token, user, isAuthenticated: true }),

  // Used by the silent refresh interceptor — update token without touching user
  setToken: (token) => set({ accessToken: token }),

  setUser: (user) => set({ user }),

  clearAuth: () => set({ accessToken: null, user: null, isAuthenticated: false }),
}));
