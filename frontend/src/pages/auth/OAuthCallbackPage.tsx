import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { userApi } from '@/api/user.api';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

// Backend redirects to: /oauth/callback?token=eyJ...
export default function OAuthCallbackPage() {
  const [params]  = useSearchParams();
  const navigate  = useNavigate();
  const { setAuth } = useAuthStore();

  useEffect(() => {
    const token = params.get('token');
    if (!token) { navigate('/login'); return; }

    // Store token then fetch user profile
    const finish = async () => {
      try {
        // Temporarily set token so the profile request is authenticated
        useAuthStore.setState({ accessToken: token, isAuthenticated: true });
        const user = await userApi.getProfile();
        setAuth(token, user);
        navigate('/');
      } catch {
        navigate('/login');
      }
    };

    void finish();
  }, [params, navigate, setAuth]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <LoadingSpinner size="lg" />
      <p className="text-muted-foreground text-sm">Finishing sign-in…</p>
    </div>
  );
}
