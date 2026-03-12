import api from './axios';
import type { User } from '@/types/auth.types';
import type { UpdateProfileInput, ChangePasswordInput, DeleteAccountInput } from '@/types/user.types';
import type { ApiResponse } from '@/types/api.types';

export const userApi = {

  getProfile: async (): Promise<User> => {
    const { data } = await api.get<ApiResponse<User>>('/api/user/profile');
    return data.data!;
  },

  updateProfile: async (input: UpdateProfileInput): Promise<User> => {
    const { data } = await api.patch<ApiResponse<User>>('/api/user/profile', input);
    return data.data!;
  },

  changePassword: async (input: ChangePasswordInput): Promise<void> => {
    await api.patch('/api/user/change-password', input);
  },

  deleteAccount: async (input: DeleteAccountInput): Promise<void> => {
    await api.delete('/api/user/account', { data: input });
  },
};
