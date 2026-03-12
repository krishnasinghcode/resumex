import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Skeleton } from '@/components/ui/skeleton';
import { SECTION_FIELDS, type FieldConfig } from '@/lib/constants';
import { useReferenceData } from '@/hooks/useReferenceData';
import type { SectionKey, VaultEntry } from '@/types/vault.types';
import { TagsInput } from './TagsInput';
import { cn } from '@/lib/utils';

// ─── ComboboxField ─────────────────────────────────────────────────────────────
// Separate component so it can call useReferenceData at the top level (hooks
// cannot be called conditionally inside a map)

function ComboboxField({
  field,
  value,
  onChange,
  error,
}: {
  field:    FieldConfig;
  value:    string;
  onChange: (val: string) => void;
  error?:   string;
}) {
  const { labels, loading } = useReferenceData(field.dataSource!);
  const [open,   setOpen]   = useState(false);
  const [search, setSearch] = useState('');

  const filtered = labels.filter(l =>
    l.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <Skeleton className="h-9 w-full" />;

  return (
    <div className="space-y-1.5">
      <Label>
        {field.label}
        {field.required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              'w-full justify-between font-normal',
              !value && 'text-muted-foreground',
              error && 'border-destructive'
            )}
          >
            <span className="truncate">{value || field.placeholder || `Select ${field.label}`}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50 shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[--radix-popover-trigger-width]" align="start">
          <Command>
            <CommandInput
              placeholder="Search…"
              value={search}
              onValueChange={setSearch}
              onKeyDown={(e) => {
                // Press Enter on a custom value when allowCustom is true
                if (
                  e.key === 'Enter' &&
                  field.allowCustom &&
                  search.trim() &&
                  !labels.includes(search.trim())
                ) {
                  onChange(search.trim());
                  setOpen(false);
                  setSearch('');
                }
              }}
            />
            <CommandList>
              <CommandEmpty>
                {field.allowCustom && search.trim() ? (
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-sm text-left hover:bg-accent"
                    onClick={() => {
                      onChange(search.trim());
                      setOpen(false);
                      setSearch('');
                    }}
                  >
                    Add "{search.trim()}"
                  </button>
                ) : (
                  <p className="px-3 py-2 text-sm text-muted-foreground">No results.</p>
                )}
              </CommandEmpty>
              <CommandGroup>
                {filtered.map(opt => (
                  <CommandItem
                    key={opt}
                    value={opt}
                    onSelect={() => {
                      onChange(opt === value ? '' : opt);
                      setOpen(false);
                      setSearch('');
                    }}
                  >
                    <Check className={cn('mr-2 h-4 w-4', value === opt ? 'opacity-100' : 'opacity-0')} />
                    {opt}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// ─── TagsComboboxField ─────────────────────────────────────────────────────────

function TagsComboboxField({
  field,
  value,
  onChange,
}: {
  field:    FieldConfig;
  value:    string[];
  onChange: (val: string[]) => void;
}) {
  const { labels, loading } = useReferenceData(field.dataSource!);
  const [open,   setOpen]   = useState(false);
  const [search, setSearch] = useState('');

  // Exclude already-selected items from the dropdown
  const filtered = labels.filter(l =>
    l.toLowerCase().includes(search.toLowerCase()) && !value.includes(l)
  );

  const add = (item: string) => {
    if (!value.includes(item)) onChange([...value, item]);
    setSearch('');
    // Keep popover open so user can keep picking
  };

  const remove = (item: string) => onChange(value.filter(v => v !== item));

  if (loading) return <Skeleton className="h-9 w-full" />;

  return (
    <div className="sm:col-span-2 space-y-1.5">
      <Label>{field.label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            className="w-full justify-between font-normal text-muted-foreground"
          >
            {field.placeholder || `Search ${field.label}…`}
            <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50 shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[--radix-popover-trigger-width]" align="start">
          <Command>
            <CommandInput
              placeholder="Search…"
              value={search}
              onValueChange={setSearch}
              onKeyDown={(e) => {
                if (
                  e.key === 'Enter' &&
                  field.allowCustom &&
                  search.trim() &&
                  !value.includes(search.trim())
                ) {
                  add(search.trim());
                }
              }}
            />
            <CommandList>
              <CommandEmpty>
                {field.allowCustom && search.trim() ? (
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-sm text-left hover:bg-accent"
                    onClick={() => add(search.trim())}
                  >
                    Add "{search.trim()}"
                  </button>
                ) : (
                  <p className="px-3 py-2 text-sm text-muted-foreground">No results.</p>
                )}
              </CommandEmpty>
              <CommandGroup>
                {filtered.map(opt => (
                  <CommandItem key={opt} value={opt} onSelect={() => add(opt)}>
                    <Check className="mr-2 h-4 w-4 opacity-0" />
                    {opt}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected tags shown below the trigger */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {value.map(tag => (
            <span key={tag} className="tag-chip">
              {tag}
              <button type="button" onClick={() => remove(tag)}>
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── EntryForm ─────────────────────────────────────────────────────────────────

interface EntryFormProps {
  sectionKey: SectionKey;
  entry?:     VaultEntry | null;
  onSubmit:   (data: Record<string, unknown>) => Promise<boolean>;
  onCancel:   () => void;
  saving?:    boolean;
}

export function EntryForm({ sectionKey, entry, onSubmit, onCancel, saving = false }: EntryFormProps) {
  const fields = SECTION_FIELDS[sectionKey];

  // Build Zod schema from field configs
  const schemaShape: Record<string, z.ZodTypeAny> = {};
  fields.forEach(f => {
    let s: z.ZodTypeAny;
    switch (f.type) {
      case 'number':
        s = z.union([z.number(), z.string().transform(v => v === '' ? undefined : Number(v))]).optional();
        break;
      case 'checkbox':
        s = z.boolean().optional();
        break;
      case 'tags':
      case 'tags-combobox':
        s = z.array(z.string()).optional();
        break;
      case 'combobox':
        s = f.required ? z.string().min(1, `${f.label} is required`) : z.string().optional();
        break;
      default:
        s = f.required ? z.string().min(1, `${f.label} is required`) : z.string().optional();
    }
    schemaShape[f.name] = s;
  });
  const schema = z.object(schemaShape);

  const getDefaultValue = (f: FieldConfig) => {
    if (f.type === 'checkbox')      return false;
    if (f.type === 'tags')          return [];
    if (f.type === 'tags-combobox') return [];
    return '';
  };

  const buildDefaults = (source?: VaultEntry | null) =>
    Object.fromEntries(
      fields.map(f => [
        f.name,
        source
          ? ((source as Record<string, unknown>)[f.name] ?? getDefaultValue(f))
          : getDefaultValue(f),
      ])
    );

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: buildDefaults(entry),
  });

  useEffect(() => {
    if (entry) reset(buildDefaults(entry));
  }, [entry]); // eslint-disable-line react-hooks/exhaustive-deps

  const watchedValues = watch();

  const onValid = async (data: Record<string, unknown>) => {
    const cleaned = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== '' && v !== undefined && v !== null)
    );
    const success = await onSubmit(cleaned);
    if (success && !entry) reset(buildDefaults(null));
  };

  return (
    <form onSubmit={handleSubmit(onValid)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {fields.map(field => {
          const error = errors[field.name]?.message as string | undefined;
          const isConditionallyRequired = field.requiredWhen?.(watchedValues as Record<string, unknown>);

          // ── Checkbox ──────────────────────────────────────────────────────
          if (field.type === 'checkbox') {
            return (
              <div key={field.name} className="sm:col-span-2 flex items-center gap-2">
                <Checkbox
                  id={field.name}
                  checked={!!watchedValues[field.name]}
                  onCheckedChange={(v) => setValue(field.name, !!v)}
                />
                <Label htmlFor={field.name} className="font-normal cursor-pointer">
                  {field.label}
                </Label>
              </div>
            );
          }

          // ── Textarea ──────────────────────────────────────────────────────
          if (field.type === 'textarea') {
            return (
              <div key={field.name} className="sm:col-span-2 space-y-1.5">
                <Label htmlFor={field.name}>
                  {field.label}
                  {(field.required || isConditionallyRequired) && (
                    <span className="text-destructive ml-0.5">*</span>
                  )}
                </Label>
                <Textarea
                  id={field.name}
                  placeholder={field.placeholder}
                  rows={3}
                  {...register(field.name)}
                  className={cn(error && 'border-destructive')}
                />
                {error && <p className="text-xs text-destructive">{error}</p>}
              </div>
            );
          }

          // ── Tags (free text) ──────────────────────────────────────────────
          if (field.type === 'tags') {
            return (
              <div key={field.name} className="sm:col-span-2 space-y-1.5">
                <Label>{field.label}</Label>
                <TagsInput
                  value={(watchedValues[field.name] as string[]) || []}
                  onChange={(tags) => setValue(field.name, tags)}
                  placeholder={field.placeholder}
                />
              </div>
            );
          }

          // ── Tags combobox (multi, from DB) ────────────────────────────────
          if (field.type === 'tags-combobox') {
            return (
              <TagsComboboxField
                key={field.name}
                field={field}
                value={(watchedValues[field.name] as string[]) || []}
                onChange={(val) => setValue(field.name, val)}
              />
            );
          }

          // ── Combobox (single, from DB) ────────────────────────────────────
          if (field.type === 'combobox') {
            return (
              <ComboboxField
                key={field.name}
                field={field}
                value={(watchedValues[field.name] as string) || ''}
                onChange={(val) => setValue(field.name, val)}
                error={error}
              />
            );
          }

          // ── Select (static options) ───────────────────────────────────────
          if (field.type === 'select') {
            return (
              <div key={field.name} className="space-y-1.5">
                <Label htmlFor={field.name}>
                  {field.label}
                  {(field.required || isConditionallyRequired) && (
                    <span className="text-destructive ml-0.5">*</span>
                  )}
                </Label>
                <Select
                  value={(watchedValues[field.name] as string) || ''}
                  onValueChange={(v) => setValue(field.name, v)}
                >
                  <SelectTrigger id={field.name} className={cn(error && 'border-destructive')}>
                    <SelectValue placeholder={`Select ${field.label}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options?.map(opt => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {error && <p className="text-xs text-destructive">{error}</p>}
              </div>
            );
          }

          // ── Default: text, email, tel, date, number, url ──────────────────
          return (
            <div key={field.name} className="space-y-1.5">
              <Label htmlFor={field.name}>
                {field.label}
                {(field.required || isConditionallyRequired) && (
                  <span className="text-destructive ml-0.5">*</span>
                )}
              </Label>
              <Input
                id={field.name}
                type={field.type}
                placeholder={field.placeholder}
                {...register(field.name)}
                className={cn(error && 'border-destructive')}
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={saving}>
          <X className="w-4 h-4 mr-1" />
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={saving}>
          {saving ? 'Saving…' : entry ? 'Save changes' : 'Add entry'}
        </Button>
      </div>
    </form>
  );
}
