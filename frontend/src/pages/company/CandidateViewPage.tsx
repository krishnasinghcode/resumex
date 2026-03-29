import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorBanner } from '@/components/common/ErrorBanner';
import { SECTION_CONFIG } from '@/lib/constants';
import { companyApi } from '@/api/company.api';
import { getErrorMessage } from '@/api/axios';
import type { SectionKey } from '@/types/vault.types';

export default function CandidateViewPage() {
  const { userId }     = useParams<{ userId: string }>();
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();

  const [data,    setData]    = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    const permissionId = searchParams.get('permission');
    if (!permissionId) {
      setError('Permission ID missing from URL');
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        // Step 1 — fetch the scoped token from the server (company must own it)
        const tokenRes  = await companyApi.getScopedToken(permissionId);
        const scopedToken = tokenRes.data.data.rawToken;

        // Step 2 — fetch candidate data using the scoped token
        const dataRes = await companyApi.getCandidateData(userId, scopedToken);
        setData(dataRes.data.data);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [userId, searchParams]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b px-6 py-4 flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="font-bold">Candidate Profile</h1>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Access logged
          </p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {loading && <LoadingSpinner />}
        {error   && <ErrorBanner message={error} />}

        {!loading && data && Object.entries(data).map(([sectionKey, entries]) => {
          const config = SECTION_CONFIG[sectionKey as SectionKey];
          if (!config) return null;

          return (
            <section key={sectionKey} className="space-y-3">
              <div className="flex items-center gap-2 border-b pb-2">
                <span>{config.icon}</span>
                <h2 className="font-semibold">{config.label}</h2>
              </div>
              {Array.isArray(entries) && entries.map((entry: any, i: number) => (
                <div key={entry._id ?? i} className="rounded-lg border p-4 space-y-1.5">
                  {Object.entries(entry)
                    .filter(([k]) => k !== '_id')
                    .map(([key, value]) => (
                      <div key={key} className="flex gap-2 text-sm">
                        <span className="text-muted-foreground capitalize min-w-32">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <span className="font-medium">
                          {Array.isArray(value) ? value.join(', ') : String(value)}
                        </span>
                      </div>
                    ))
                  }
                </div>
              ))}
            </section>
          );
        })}
      </main>
    </div>
  );
}