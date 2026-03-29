import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ErrorBanner } from '@/components/common/ErrorBanner';
import { cn } from '@/lib/utils';
import { SECTION_CONFIG, SECTION_FIELDS } from '@/lib/constants';
import { ALL_SECTION_KEYS, type SectionKey } from '@/types/vault.types';
import { refidApi } from '@/api/refid.api';
import { getErrorMessage } from '@/api/axios';

// Sections that don't make sense to share with recruiters — hide from list
const EXCLUDED_SECTIONS: SectionKey[] = ['resume_docs', 'application_metadata'];
const AVAILABLE_SECTIONS = ALL_SECTION_KEYS.filter(k => !EXCLUDED_SECTIONS.includes(k));

const DURATION_OPTIONS = [
  { label: '7 days',   value: 7  },
  { label: '30 days',  value: 30 },
  { label: '90 days',  value: 90 },
  { label: 'Custom',   value: 0  },
];

interface SectionSelection {
  enabled:        boolean;
  expanded:       boolean;
  allFields:      boolean;           // true = whole section, false = specific fields
  selectedFields: Set<string>;
}

type SelectionMap = Record<SectionKey, SectionSelection>;

const buildInitialSelection = (): SelectionMap => {
  const map = {} as SelectionMap;
  AVAILABLE_SECTIONS.forEach(key => {
    map[key] = { enabled: false, expanded: false, allFields: true, selectedFields: new Set() };
  });
  return map;
};

export default function CreateRefIDPage() {
  const navigate = useNavigate();

  const [jobTitle,    setJobTitle]    = useState('');
  const [selection,   setSelection]   = useState<SelectionMap>(buildInitialSelection);
  const [duration,    setDuration]    = useState<number>(30);
  const [customDays,  setCustomDays]  = useState('');
  const [isCustom,    setIsCustom]    = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  // ── Selection helpers ──────────────────────────────────────────────────────

  const toggleSection = (key: SectionKey) => {
    setSelection(prev => ({
      ...prev,
      [key]: { ...prev[key], enabled: !prev[key].enabled },
    }));
  };

  const toggleExpanded = (key: SectionKey) => {
    setSelection(prev => ({
      ...prev,
      [key]: { ...prev[key], expanded: !prev[key].expanded },
    }));
  };

  const setAllFields = (key: SectionKey, value: boolean) => {
    setSelection(prev => ({
      ...prev,
      [key]: { ...prev[key], allFields: value, selectedFields: new Set() },
    }));
  };

  const toggleField = (key: SectionKey, fieldName: string) => {
    setSelection(prev => {
      const next = new Set(prev[key].selectedFields);
      next.has(fieldName) ? next.delete(fieldName) : next.add(fieldName);
      return { ...prev, [key]: { ...prev[key], selectedFields: next } };
    });
  };

  // ── Build payload ──────────────────────────────────────────────────────────

  const buildRequestedFields = () => {
    return AVAILABLE_SECTIONS
      .filter(key => selection[key].enabled)
      .map(key => {
        const s = selection[key];
        if (s.allFields || s.selectedFields.size === 0) {
          return { section: key };
        }
        return { section: key, fields: Array.from(s.selectedFields) };
      });
  };

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const requestedFields = buildRequestedFields();
    if (!jobTitle.trim())          return setError('Job title is required');
    if (requestedFields.length < 1) return setError('Select at least one section');

    const finalDuration = isCustom ? Number(customDays) : duration;
    if (!finalDuration || finalDuration < 1 || finalDuration > 180)
      return setError('Duration must be between 1 and 180 days');

    setSubmitting(true);
    try {
      const { data } = await refidApi.createRefID({
        jobTitle: jobTitle.trim(),
        requestedFields,
        accessDuration: finalDuration,
      });
      navigate('/company/dashboard', {
        state: { newCode: data.data.refID.code },
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const enabledCount = AVAILABLE_SECTIONS.filter(k => selection[k].enabled).length;

  return (
    <div className="min-h-screen bg-background">

      {/* Header */}
      <header className="border-b px-6 py-4 flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/company/dashboard')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="font-bold">Create RefID</h1>
          <p className="text-xs text-muted-foreground">Define what data you need from candidates</p>
        </div>
      </header>

      <form onSubmit={handleSubmit}>
        <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">

          {/* Job title */}
          <div className="space-y-1.5">
            <Label htmlFor="jobTitle">Job Title <span className="text-destructive">*</span></Label>
            <Input
              id="jobTitle"
              placeholder="e.g. Frontend Developer"
              value={jobTitle}
              onChange={e => setJobTitle(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Used to generate the RefID code and shown to candidates on the consent screen.
            </p>
          </div>

          {/* Section + field selector */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label>Requested Data</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Choose which sections — and optionally specific fields — you need.
                </p>
              </div>
              <span className="text-xs text-muted-foreground">
                {enabledCount} section{enabledCount !== 1 ? 's' : ''} selected
              </span>
            </div>

            <div className="space-y-2">
              {AVAILABLE_SECTIONS.map(key => {
                const config  = SECTION_CONFIG[key];
                const fields  = SECTION_FIELDS[key];
                const s       = selection[key];

                return (
                  <div
                    key={key}
                    className={cn(
                      'border rounded-lg overflow-hidden transition-colors',
                      s.enabled ? 'border-primary/40 bg-primary/5' : 'border-border'
                    )}
                  >
                    {/* Section row */}
                    <div className="flex items-center gap-3 px-4 py-3">
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        id={`section-${key}`}
                        checked={s.enabled}
                        onChange={() => toggleSection(key)}
                        className="w-4 h-4 accent-primary rounded"
                      />

                      {/* Icon + label */}
                      <label
                        htmlFor={`section-${key}`}
                        className="flex items-center gap-2 flex-1 cursor-pointer"
                      >
                        <span className="text-lg">{config.icon}</span>
                        <div>
                          <p className="text-sm font-medium">{config.label}</p>
                          <p className="text-xs text-muted-foreground">{config.description}</p>
                        </div>
                      </label>

                      {/* Expand/collapse field picker — only when section enabled */}
                      {s.enabled && (
                        <button
                          type="button"
                          onClick={() => toggleExpanded(key)}
                          className="text-muted-foreground hover:text-foreground transition-colors p-1"
                        >
                          {s.expanded
                            ? <ChevronDown className="w-4 h-4" />
                            : <ChevronRight className="w-4 h-4" />
                          }
                        </button>
                      )}
                    </div>

                    {/* Field picker — shown when section enabled + expanded */}
                    {s.enabled && s.expanded && (
                      <div className="border-t bg-muted/20 px-4 py-3 space-y-3">

                        {/* All fields / specific fields toggle */}
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <input
                              type="radio"
                              name={`fieldmode-${key}`}
                              checked={s.allFields}
                              onChange={() => setAllFields(key, true)}
                              className="accent-primary"
                            />
                            All fields
                          </label>
                          <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <input
                              type="radio"
                              name={`fieldmode-${key}`}
                              checked={!s.allFields}
                              onChange={() => setAllFields(key, false)}
                              className="accent-primary"
                            />
                            Specific fields only
                          </label>
                        </div>

                        {/* Field checkboxes */}
                        {!s.allFields && (
                          <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-1">
                            {fields.map(field => (
                              <label
                                key={field.name}
                                className="flex items-center gap-2 text-sm cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={s.selectedFields.has(field.name)}
                                  onChange={() => toggleField(key, field.name)}
                                  className="w-3.5 h-3.5 accent-primary rounded"
                                />
                                <span className="text-muted-foreground">{field.label}</span>
                              </label>
                            ))}
                          </div>
                        )}

                        {!s.allFields && s.selectedFields.size === 0 && (
                          <p className="text-xs text-amber-500">
                            No fields selected — the full section will be requested.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Access duration */}
          <div className="space-y-3">
            <Label>Access Duration</Label>
            <div className="flex gap-2 flex-wrap">
              {DURATION_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    if (opt.value === 0) {
                      setIsCustom(true);
                    } else {
                      setIsCustom(false);
                      setDuration(opt.value);
                    }
                  }}
                  className={cn(
                    'px-4 py-2 rounded-lg border text-sm font-medium transition-colors',
                    (opt.value === 0 ? isCustom : !isCustom && duration === opt.value)
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:bg-muted/50'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {isCustom && (
              <div className="flex items-center gap-2 max-w-[200px]">
                <Input
                  type="number"
                  placeholder="e.g. 60"
                  min={1}
                  max={180}
                  value={customDays}
                  onChange={e => setCustomDays(e.target.value)}
                />
                <span className="text-sm text-muted-foreground whitespace-nowrap">days (max 180)</span>
              </div>
            )}
          </div>

          {error && <ErrorBanner message={error} />}

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => navigate('/company/dashboard')}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={submitting}>
              <Plus className="w-4 h-4 mr-1.5" />
              {submitting ? 'Creating…' : 'Create RefID'}
            </Button>
          </div>

        </div>
      </form>
    </div>
  );
}
