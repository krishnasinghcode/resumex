import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/api/auth.api';
import { useAuthStore } from '@/store/auth.store';
import { getErrorMessage } from '@/api/axios';
import type { LoginInput, RegisterInput } from '@/types/auth.types';

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const { setAuth, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const register = async (input: RegisterInput) => {
    setLoading(true); setError(null);
    try {
      const { accessToken, user } = await authApi.register(input);
      setAuth(accessToken, user);
      navigate('/');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const login = async (input: LoginInput) => {
    setLoading(true); setError(null);
    try {
      const { accessToken, user } = await authApi.login(input);
      setAuth(accessToken, user);
      navigate('/');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      clearAuth();
      navigate('/login');
    }
  };

  return { register, login, logout, loading, error };
};
