import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore }    from '@/store/auth.store';
import { useCompanyStore } from '@/store/company.store';

// ── User pages ────────────────────────────────────────────────────────────────
import LoginPage         from '@/pages/auth/LoginPage';
import RegisterPage      from '@/pages/auth/RegisterPage';
import OAuthCallbackPage from '@/pages/auth/OAuthCallbackPage';
import DashboardPage     from '@/pages/dashboard/DashboardPage';
import SectionPage       from '@/pages/vault/SectionPage';
import SearchPage        from '@/pages/search/SearchPage';
import ProfilePage       from '@/pages/profile/ProfilePage';

// ── Phase 2 pages ─────────────────────────────────────────────────────────────
import ConnectPage          from '@/pages/connect/ConnectPage';
import ConsentPage          from '@/pages/consent/ConsentPage';
import CompanyLoginPage     from '@/pages/company/CompanyLoginPage';
import CompanyRegisterPage  from '@/pages/company/CompanyRegisterPage';
import CompanyDashboardPage from '@/pages/company/CompanyDashboardPage';
import RefIDDetailPage      from '@/pages/company/RefIDDetailPage';
import CandidateViewPage    from '@/pages/company/CandidateViewPage';
import CreateRefIDPage      from '@/pages/company/CreateRefIDPage';
import CompanyProfilePage   from '@/pages/company/CompanyProfilePage';
import AccessLogPage        from '@/pages/company/AccessLogPage';

// ── Route guards ──────────────────────────────────────────────────────────────

function ProtectedRoute() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

function PublicRoute() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  return isAuthenticated ? <Navigate to="/" replace /> : <Outlet />;
}

function CompanyProtectedRoute() {
  const isAuthenticated = useCompanyStore(s => s.isAuthenticated);
  return isAuthenticated ? <Outlet /> : <Navigate to="/company/login" replace />;
}

// ── Router ────────────────────────────────────────────────────────────────────

export const router = createBrowserRouter([

  // ── Public (redirect away if already logged in) ───────────────────────────
  {
    element: <PublicRoute />,
    children: [
      { path: '/login',    element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
    ],
  },

  // OAuth callback — no auth check
  { path: '/oauth/callback', element: <OAuthCallbackPage /> },

  // ── User protected ────────────────────────────────────────────────────────
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/',                  element: <DashboardPage /> },
      { path: '/vault/:sectionKey', element: <SectionPage /> },
      { path: '/search',            element: <SearchPage /> },
      { path: '/profile',           element: <ProfilePage /> },
      { path: '/connect',           element: <ConnectPage /> },
      { path: '/consent/:refCode',  element: <ConsentPage /> },
    ],
  },

  // ── Company public ────────────────────────────────────────────────────────
  { path: '/company/login',    element: <CompanyLoginPage /> },
  { path: '/company/register', element: <CompanyRegisterPage /> },

  // ── Company protected ─────────────────────────────────────────────────────
  {
    element: <CompanyProtectedRoute />,
    children: [
      { path: '/company/dashboard',         element: <CompanyDashboardPage /> },
      { path: '/company/refid/new',         element: <CreateRefIDPage /> },
      { path: '/company/refid/:refCode',    element: <RefIDDetailPage /> },
      { path: '/company/candidate/:userId', element: <CandidateViewPage /> },
      { path: '/company/profile',           element: <CompanyProfilePage /> },
      { path: '/company/logs',              element: <AccessLogPage /> },
    ],
  },

  // Catch-all
  { path: '*', element: <Navigate to="/" replace /> },
]);
