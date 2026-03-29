import { useState } from 'react';
import { ChevronDown, ChevronRight, Lock, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SECTION_CONFIG, SECTION_FIELDS } from '@/lib/constants';
import type { SectionKey } from '@/types/vault.types';

interface RequestedField {
  section: SectionKey;
  fields?: string[];
}

interface ConsentCardProps {
  requestedField:   RequestedField;
  hasPrivateFields?: boolean;
}

export function ConsentCard({ requestedField, hasPrivateFields }: ConsentCardProps) {
  const [expanded, setExpanded] = useState(false);

  const { section, fields } = requestedField;
  const config        = SECTION_CONFIG[section];
  const sectionFields = SECTION_FIELDS[section];

  const displayFields = fields && fields.length > 0
    ? sectionFields.filter(f => fields.includes(f.name))
    : sectionFields;

  return (
    <div className={cn(
      'border rounded-lg overflow-hidden transition-all',
      hasPrivateFields ? 'border-amber-500/40' : 'border-border'
    )}>
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{config.icon}</span>
          <div className="text-left">
            <p className="font-medium text-sm">{config.label}</p>
            <p className="text-xs text-muted-foreground">
              {fields && fields.length > 0
                ? `${fields.length} specific field${fields.length > 1 ? 's' : ''}`
                : 'Full section'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasPrivateFields && (
            <span className="flex items-center gap-1 text-xs text-amber-500 font-medium">
              <Lock className="w-3 h-3" />
              Contains private fields
            </span>
          )}
          {expanded
            ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
            : <ChevronRight className="w-4 h-4 text-muted-foreground" />
          }
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-3 border-t bg-muted/20">
          <ul className="mt-3 space-y-1.5">
            {displayFields.map(field => (
              <li key={field.name} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Eye className="w-3 h-3 shrink-0" />
                {field.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
