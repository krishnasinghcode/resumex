import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, LogOut, User, ScrollText, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorBanner } from '@/components/common/ErrorBanner';
import { EmptyState } from '@/components/common/EmptyState';
import { RefIDCard } from '@/components/company/RefIDCard';
import { useCompanyDashboard } from '@/hooks/useCompanyDashboard';
import { useCompanyStore } from '@/store/company.store';
import { companyApi } from '@/api/company.api';
import { refidApi } from '@/api/refid.api';
import { getErrorMessage } from '@/api/axios';

export default function CompanyDashboardPage() {
  const navigate   = useNavigate();
  const company    = useCompanyStore(s => s.company);
  const clearAuth  = useCompanyStore(s => s.clearAuth);
  const { refIDs, loading, error, refetch } = useCompanyDashboard();

  const [loggingOut,    setLoggingOut]    = useState(false);
  const [togglingCode,  setTogglingCode]  = useState<string | null>(null);
  const [toggleError,   setToggleError]   = useState<string | null>(null);

  const handleLogout = async () => {
    setLoggingOut(true);
    try { await companyApi.logout(); } catch { /* ignore */ }
    clearAuth();
    navigate('/company/login');
  };

  const handleToggleActive = async (code: string, isCurrentlyActive: boolean) => {
    setTogglingCode(code); setToggleError(null);
    try {
      if (isCurrentlyActive) {
        await refidApi.deactivateRefID(code);
      } else {
        await refidApi.activateRefID(code);
      }
      await refetch();
    } catch (err) {
      setToggleError(getErrorMessage(err));
    } finally {
      setTogglingCode(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">

      {/* Header */}
      <header className="border-b px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-lg">{company?.name}</h1>
          <p className="text-xs text-muted-foreground">ResumeX Recruiter Dashboard</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => navigate('/company/logs')} title="Access Log">
            <ScrollText className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => navigate('/company/profile')} title="Company Profile">
            <User className="w-4 h-4" />
          </Button>
          <Button size="sm" onClick={() => navigate('/company/refid/new')}>
            <Plus className="w-4 h-4 mr-1" />
            New RefID
          </Button>
          <Button size="sm" variant="ghost" onClick={handleLogout} disabled={loggingOut} title="Logout">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-8 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Your RefIDs</h2>
          <p className="text-sm text-muted-foreground">{refIDs.length} total</p>
        </div>

        {loading && <LoadingSpinner />}
        {error        && <ErrorBanner message={error} />}
        {toggleError  && <ErrorBanner message={toggleError} />}

        {!loading && !error && refIDs.length === 0 && (
          <EmptyState
            title="No RefIDs yet"
            description="Create your first RefID to start collecting candidate data."
          />
        )}

        {!loading && refIDs.map(ref => (
          <div key={ref.code} className="relative">
            <RefIDCard refID={ref} />

            {/* Deactivate / Activate toggle */}
            <button
              type="button"
              onClick={() => handleToggleActive(ref.code, ref.isActive)}
              disabled={togglingCode === ref.code}
              title={ref.isActive ? 'Deactivate RefID' : 'Activate RefID'}
              className="absolute top-3 right-10 text-muted-foreground hover:text-foreground transition-colors p-1"
            >
              {togglingCode === ref.code
                ? <span className="text-xs">…</span>
                : ref.isActive
                  ? <ToggleRight className="w-5 h-5 text-green-500" />
                  : <ToggleLeft  className="w-5 h-5" />
              }
            </button>
          </div>
        ))}
      </main>
    </div>
  );
}
