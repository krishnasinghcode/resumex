import { useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal } from 'lucide-react';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useSearch } from '@/hooks/useSearch';
import { useVaultMeta } from '@/hooks/useVaultMeta';
import { SECTION_CONFIG } from '@/lib/constants';
import type { SectionKey } from '@/types/vault.types';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export default function SearchPage() {
  const { meta } = useVaultMeta();
  const { query, setQuery, results, loading, error, includePrivate, setIncludePrivate } = useSearch();
  const navigate = useNavigate();

  return (
    <PageWrapper meta={meta}>
      <div className="p-6 max-w-2xl mx-auto page-enter">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold tracking-tight">Search your vault</h1>
          <p className="text-sm text-muted-foreground mt-1">Search across all sections and entries</p>
        </div>

        {/* Search input */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search for skills, companies, projects…"
            className="pl-9 h-10"
          />
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <LoadingSpinner size="sm" />
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-6">
          <Switch
            id="include-private"
            checked={includePrivate}
            onCheckedChange={setIncludePrivate}
          />
          <Label htmlFor="include-private" className="text-sm text-muted-foreground cursor-pointer">
            Include private sections
          </Label>
        </div>

        {/* Empty / idle state */}
        {!query && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Search className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">Start typing to search your vault</p>
          </div>
        )}

        {/* Too short */}
        {query && query.length < 2 && (
          <p className="text-sm text-muted-foreground text-center py-8">Type at least 2 characters</p>
        )}

        {/* Error */}
        {error && <p className="text-sm text-destructive text-center py-8">{error}</p>}

        {/* Results */}
        {results && query.length >= 2 && (
          <div>
            <p className="text-xs text-muted-foreground mb-3">
              {results.count === 0
                ? `No results for "${results.query}"`
                : `${results.count} result${results.count === 1 ? '' : 's'} for "${results.query}"`}
            </p>

            {results.count === 0 ? (
              <div className="text-center py-12">
                <p className="text-4xl mb-3">🔍</p>
                <p className="font-medium text-sm">Nothing found</p>
                <p className="text-xs text-muted-foreground mt-1">Try a different search term</p>
              </div>
            ) : (
              <div className="space-y-2">
                {results.results.map((hit, i) => {
                  const config = SECTION_CONFIG[hit.sectionKey as SectionKey];
                  return (
                    <button
                      key={`${hit.sectionKey}-${hit.entryId}-${i}`}
                      onClick={() => navigate(`/vault/${hit.sectionKey}`)}
                      className={cn(
                        'w-full text-left rounded-lg border bg-card p-4 transition-all duration-150',
                        'hover:border-primary/30 hover:shadow-sm hover:-translate-y-0.5',
                        hit.isPrivate || hit.entryIsPrivate ? 'border-amber-200/60' : ''
                      )}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg leading-none">{config.icon}</span>
                        <span className="text-xs font-semibold text-muted-foreground">{config.label}</span>
                        {(hit.isPrivate || hit.entryIsPrivate) && (
                          <Badge variant="private" className="text-[10px] px-1.5 py-0">Private</Badge>
                        )}
                      </div>
                      <div className="space-y-1">
                        {hit.matchedFields.map(f => (
                          <div key={f.field} className="flex items-baseline gap-2">
                            <span className="text-xs text-muted-foreground capitalize min-w-[72px]">
                              {f.field.replace(/([A-Z])/g, ' $1').toLowerCase()}
                            </span>
                            <span className="text-sm font-medium truncate">{f.value}</span>
                          </div>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
