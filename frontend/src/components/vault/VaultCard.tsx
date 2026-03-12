import { useNavigate } from 'react-router-dom';
import { ChevronRight, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { SECTION_CONFIG } from '@/lib/constants';
import type { SectionKey, SectionMeta } from '@/types/vault.types';
import { cn } from '@/lib/utils';

interface VaultCardProps {
  sectionKey: SectionKey;
  meta:       SectionMeta;
}

export function VaultCard({ sectionKey, meta }: VaultCardProps) {
  const navigate = useNavigate();
  const config   = SECTION_CONFIG[sectionKey];

  return (
    <button
      onClick={() => navigate(`/vault/${sectionKey}`)}
      className={cn(
        'group w-full text-left rounded-xl border bg-card p-5 transition-all duration-150',
        'hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        meta.isPrivate && 'border-amber-200/60'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl leading-none select-none">{config.icon}</span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm text-foreground">{config.label}</h3>
              {meta.isPrivate && <Lock className="w-3 h-3 text-amber-500" />}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{config.description}</p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors flex-shrink-0 mt-0.5" />
      </div>

      <div className="flex items-center gap-2 mt-4">
        {meta.isComplete
          ? <Badge variant="success">Complete</Badge>
          : <Badge variant="secondary">
              {meta.entryCount === 0 ? 'Empty' : 'In progress'}
            </Badge>
        }
        {meta.entryCount > 0 && (
          <span className="text-xs text-muted-foreground">
            {meta.entryCount} {meta.entryCount === 1 ? 'entry' : 'entries'}
          </span>
        )}
        {meta.isPrivate && (
          <Badge variant="private" className="ml-auto">Private</Badge>
        )}
      </div>
    </button>
  );
}
