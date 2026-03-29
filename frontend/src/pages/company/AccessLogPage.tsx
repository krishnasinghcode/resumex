import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, User, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorBanner } from '@/components/common/ErrorBanner';
import { EmptyState } from '@/components/common/EmptyState';
import { companyApi } from '@/api/company.api';
import { getErrorMessage } from '@/api/axios';
import { SECTION_CONFIG } from '@/lib/constants';
import type { SectionKey } from '@/types/vault.types';

interface AccessLogEntry {
  _id:          string;
  userId: {
    _id:         string;
    displayName: string;
    email:       string;
  };
  refIdCode:      string;
  fieldsAccessed: { section: SectionKey; fields?: string[] }[];
  ip:             string;
  userAgent:      string;
  accessedAt:     string;
}

export default function AccessLogPage() {
  const navigate                      = useNavigate();
  const [logs,    setLogs]    = useState<AccessLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    companyApi.getAccessLogs()
      .then(res => setLogs(res.data.data.logs))
      .catch(err => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-background">

      <header className="border-b px-6 py-4 flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/company/dashboard')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="font-bold">Access Log</h1>
          <p className="text-xs text-muted-foreground">Every candidate data view — immutable record</p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-4">
        {loading && <LoadingSpinner />}
        {error   && <ErrorBanner message={error} />}

        {!loading && !error && logs.length === 0 && (
          <EmptyState
            title="No access logs yet"
            description="Logs appear here every time you view a candidate's data."
          />
        )}

        {!loading && logs.map(log => (
          <div key={log._id} className="border rounded-lg p-4 space-y-3">

            {/* Top row */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-sm font-medium">{log.userId?.displayName ?? 'Unknown'}</p>
                  <p className="text-xs text-muted-foreground">{log.userId?.email}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-mono text-muted-foreground">{log.refIdCode}</p>
                <p className="text-xs text-muted-foreground flex items-center justify-end gap-1 mt-0.5">
                  <Clock className="w-3 h-3" />
                  {new Date(log.accessedAt).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Sections accessed */}
            <div className="flex flex-wrap gap-1.5">
              {log.fieldsAccessed.map(f => {
                const config = SECTION_CONFIG[f.section];
                return (
                  <span
                    key={f.section}
                    className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-0.5 rounded-full"
                    title={f.fields ? `Fields: ${f.fields.join(', ')}` : 'Full section'}
                  >
                    <span>{config?.icon}</span>
                    {config?.label}
                    {f.fields && f.fields.length > 0 && (
                      <span className="text-muted-foreground">({f.fields.length} fields)</span>
                    )}
                  </span>
                );
              })}
            </div>

            {/* Meta */}
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground/60 pt-1 border-t">
              <span>IP: {log.ip}</span>
              <span className="truncate">{log.userAgent}</span>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
