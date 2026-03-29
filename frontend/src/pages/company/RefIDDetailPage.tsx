import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorBanner } from '@/components/common/ErrorBanner';
import { EmptyState } from '@/components/common/EmptyState';
import { CandidateRow } from '@/components/company/CandidateRow';
import { companyApi } from '@/api/company.api';
import { getErrorMessage } from '@/api/axios';

export default function RefIDDetailPage() {
  const { refCode }                   = useParams<{ refCode: string }>();
  const navigate                      = useNavigate();
  const [data,    setData]    = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (!refCode) return;
    companyApi.getRefIDCandidates(refCode)
      .then(res => setData(res.data.data))
      .catch(err => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [refCode]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b px-6 py-4 flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/company/dashboard')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="font-bold">{data?.refID?.jobTitle ?? 'Loading…'}</h1>
          <p className="text-xs text-muted-foreground font-mono">{refCode}</p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-4">
        {loading && <LoadingSpinner />}
        {error   && <ErrorBanner message={error} />}
        {!loading && !error && data?.permissions?.length === 0 && (
          <EmptyState
            title="No candidates yet"
            description="Share this RefID with candidates to start receiving applications."
          />
        )}
        {!loading && data?.permissions?.length > 0 && (
          <div className="border rounded-lg overflow-hidden">
            {data.permissions.map((perm: any) => (
              <CandidateRow key={perm._id} permission={perm} refCode={refCode!} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
