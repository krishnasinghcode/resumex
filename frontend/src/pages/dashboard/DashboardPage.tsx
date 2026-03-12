import { PageWrapper } from '@/components/layout/PageWrapper';
import { VaultCard } from '@/components/vault/VaultCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorBanner } from '@/components/common/ErrorBanner';
import { Skeleton } from '@/components/ui/skeleton';
import { useVaultMeta } from '@/hooks/useVaultMeta';
import { useAuthStore } from '@/store/auth.store';
import { ALL_SECTION_KEYS } from '@/types/vault.types';

export default function DashboardPage() {
  const { meta, loading, error } = useVaultMeta();
  const { user } = useAuthStore();

  const completedCount = meta
    ? ALL_SECTION_KEYS.filter(k => meta.sections[k]?.isComplete).length
    : 0;

  const completionPct = Math.round((completedCount / 14) * 100);

  return (
    <PageWrapper meta={meta}>
      <div className="p-6 max-w-5xl mx-auto page-enter">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">
            {user?.displayName ? `${user.displayName.split(' ')[0]}'s Vault` : 'Your Vault'}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Build out your profile — complete sections unlock access controls
          </p>
        </div>

        {/* Completion banner */}
        {!loading && meta && (
          <div className="mb-6 rounded-xl border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-semibold text-sm">Profile completion</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {completedCount} of 14 sections complete
                </p>
              </div>
              <span className="text-2xl font-bold tabular-nums text-primary">{completionPct}%</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-700"
                style={{ width: `${completionPct}%` }}
              />
            </div>
          </div>
        )}

        {loading && (
          <div className="mb-6 rounded-xl border bg-card p-5">
            <Skeleton className="h-4 w-48 mb-3" />
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        )}

        {/* Error */}
        {error && <ErrorBanner message={error} className="mb-6" />}

        {/* Section grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 14 }).map((_, i) => (
              <div key={i} className="rounded-xl border bg-card p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-8 h-8 rounded" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-3.5 w-28" />
                    <Skeleton className="h-3 w-36" />
                  </div>
                </div>
                <Skeleton className="h-5 w-20 rounded-md" />
              </div>
            ))}
          </div>
        ) : meta ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ALL_SECTION_KEYS.map(key => (
              <VaultCard key={key} sectionKey={key} meta={meta.sections[key]} />
            ))}
          </div>
        ) : null}
      </div>
    </PageWrapper>
  );
}
