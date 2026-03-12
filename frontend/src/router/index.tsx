import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';

// Pages
import LoginPage         from '@/pages/auth/LoginPage';
import RegisterPage      from '@/pages/auth/RegisterPage';
import OAuthCallbackPage from '@/pages/auth/OAuthCallbackPage';
import DashboardPage     from '@/pages/dashboard/DashboardPage';
import SectionPage       from '@/pages/vault/SectionPage';
import SearchPage        from '@/pages/search/SearchPage';
import ProfilePage       from '@/pages/profile/ProfilePage';

// Protected route wrapper — redirects to /login if not authenticated
function ProtectedRoute() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

// Public route wrapper — redirects to / if already authenticated
function PublicRoute() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  return isAuthenticated ? <Navigate to="/" replace /> : <Outlet />;
}

export const router = createBrowserRouter([
  // ── Public ───────────────────────────────────────────────────────────────
  {
    element: <PublicRoute />,
    children: [
      { path: '/login',          element: <LoginPage /> },
      { path: '/register',       element: <RegisterPage /> },
    ],
  },

  // OAuth callback — no auth required
  { path: '/oauth/callback', element: <OAuthCallbackPage /> },

  // ── Protected ─────────────────────────────────────────────────────────────
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/',                    element: <DashboardPage /> },
      { path: '/vault/:sectionKey',   element: <SectionPage /> },
      { path: '/search',              element: <SearchPage /> },
      { path: '/profile',             element: <ProfilePage /> },
    ],
  },

  // Catch-all redirect
  { path: '*', element: <Navigate to="/" replace /> },
]);
