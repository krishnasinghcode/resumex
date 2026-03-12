import { useState } from 'react';
import { Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PrivacyToggle } from './PrivacyToggle';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { cn } from '@/lib/utils';
import type { VaultEntry, SectionKey } from '@/types/vault.types';
import { SECTION_CONFIG } from '@/lib/constants';

interface EntryCardProps {
  entry:                SectionKey extends infer K ? (K extends SectionKey ? VaultEntry : never) : never;
  sectionKey:           SectionKey;
  onEdit:               (entry: VaultEntry) => void;
  onDelete:             (entryId: string) => Promise<boolean>;
  onTogglePrivacy:      (entryId: string, isPrivate: boolean) => Promise<void>;
  isSingleton?:         boolean;
  deletingId?:          string | null;
}

// Returns the "primary label" for an entry — first meaningful string field
function getEntryLabel(entry: VaultEntry): string {
  const priorityFields = ['name', 'title', 'company', 'institution', 'firstName', 'headline', 'fileName', 'type'];
  for (const field of priorityFields) {
    const val = (entry as Record<string, unknown>)[field];
    if (typeof val === 'string' && val) {
      if (field === 'firstName') {
        const last = (entry as Record<string, unknown>)['lastName'];
        return `${val}${typeof last === 'string' ? ' ' + last : ''}`;
      }
      return val;
    }
  }
  return 'Entry';
}

function getEntrySubtitle(entry: VaultEntry): string {
  const subtitleFields = ['company', 'title', 'employer', 'role', 'issuer', 'organization', 'platform', 'degree'];
  for (const field of subtitleFields) {
    const val = (entry as Record<string, unknown>)[field];
    if (typeof val === 'string' && val) return val;
  }
  return '';
}

export function EntryCard({ entry, sectionKey, onEdit, onDelete, onTogglePrivacy, isSingleton = false, deletingId }: EntryCardProps) {
  const [expanded,      setExpanded]      = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isDeleting = deletingId === entry._id;

  const label    = getEntryLabel(entry);
  const subtitle = getEntrySubtitle(entry);

  // Build display fields: skip internal fields and show everything else
  const skipFields = new Set(['_id', 'isPrivate', 'createdAt', 'updatedAt', '__v']);
  const displayFields = Object.entries(entry as Record<string, unknown>)
    .filter(([k, v]) => !skipFields.has(k) && v !== null && v !== undefined && v !== '')
    .slice(0, expanded ? 999 : 4); // show 4 collapsed, all expanded

  return (
    <>
      <div className={cn(
        'group rounded-lg border bg-card p-4 transition-all duration-150',
        entry.isPrivate ? 'border-amber-200/60 bg-amber-50/30' : 'hover:border-border/80 hover:shadow-sm',
        isDeleting && 'opacity-50 pointer-events-none'
      )}>

        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium text-sm truncate">{label}</p>
              {entry.isPrivate && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-medium flex-shrink-0">Private</span>
              )}
            </div>
            {subtitle && <p className="text-xs text-muted-foreground truncate mt-0.5">{subtitle}</p>}
          </div>

          {/* Actions — visible on hover */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <PrivacyToggle
              isPrivate={entry.isPrivate}
              onChange={(val) => void onTogglePrivacy(entry._id, val)}
              size="sm"
            />
            <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => onEdit(entry)}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            {!isSingleton && (
              <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive/70 hover:text-destructive hover:bg-destructive/10" onClick={() => setConfirmDelete(true)}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Field values */}
        {displayFields.length > 0 && (
          <div className="mt-3 space-y-1.5">
            {displayFields.map(([key, value]) => (
              <div key={key} className="flex gap-2 text-xs">
                <span className="text-muted-foreground font-medium capitalize min-w-[80px] flex-shrink-0">
                  {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                </span>
                <span className="text-foreground/80 truncate">
                  {Array.isArray(value)
                    ? value.join(', ')
                    : typeof value === 'boolean'
                    ? value ? 'Yes' : 'No'
                    : String(value)}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Expand toggle */}
        {Object.keys(entry as Record<string, unknown>).length > 5 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {expanded ? <><ChevronUp className="w-3 h-3" /> Show less</> : <><ChevronDown className="w-3 h-3" /> Show more</>}
          </button>
        )}
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete entry?"
        description={`This will permanently delete "${label}" from your ${SECTION_CONFIG[sectionKey].label} section.`}
        confirmLabel="Delete"
        onConfirm={async () => {
          await onDelete(entry._id);
          setConfirmDelete(false);
        }}
      />
    </>
  );
}
