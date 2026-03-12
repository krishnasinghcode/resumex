import api from './axios';
import type { AuthResponse, LoginInput, RegisterInput } from '@/types/auth.types';
import type { ApiResponse } from '@/types/api.types';

export const authApi = {

  register: async (input: RegisterInput): Promise<AuthResponse> => {
    console.log("frontend API {register}");
    const { data } = await api.post<ApiResponse<AuthResponse>>('/api/auth/register', input);
    return data.data!;
  },

  login: async (input: LoginInput): Promise<AuthResponse> => {
    const { data } = await api.post<ApiResponse<AuthResponse>>('/api/auth/login', input);
    return data.data!;
  },

  logout: async (): Promise<void> => {
    await api.post('/api/auth/logout');
  },

  logoutAll: async (): Promise<void> => {
    await api.post('/api/auth/logout-all');
  },

  refresh: async (): Promise<string> => {
    const { data } = await api.post<ApiResponse<{ accessToken: string }>>('/api/auth/refresh');
    return data.data!.accessToken;
  },

  me: async () => {
    const { data } = await api.get<ApiResponse<{ user: { userId: string; email: string; role: string } }>>('/api/auth/me');
    return data.data!.user;
  },
};
