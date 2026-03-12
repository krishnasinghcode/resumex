import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SECTION_FIELDS } from '@/lib/constants';
import type { SectionKey, VaultEntry } from '@/types/vault.types';
import { TagsInput } from './TagsInput';
import { cn } from '@/lib/utils';

interface EntryFormProps {
  sectionKey: SectionKey;
  entry?:     VaultEntry | null;
  onSubmit:   (data: Record<string, unknown>) => Promise<boolean>;
  onCancel:   () => void;
  saving?:    boolean;
}

export function EntryForm({ sectionKey, entry, onSubmit, onCancel, saving = false }: EntryFormProps) {
  const fields = SECTION_FIELDS[sectionKey];

  // Build a minimal Zod schema from field configs
  const schemaShape: Record<string, z.ZodTypeAny> = {};
  fields.forEach(f => {
    let s: z.ZodTypeAny;
    switch (f.type) {
      case 'number':   s = z.union([z.number(), z.string().transform(v => v === '' ? undefined : Number(v))]).optional(); break;
      case 'checkbox': s = z.boolean().optional(); break;
      case 'tags':     s = z.array(z.string()).optional(); break;
      default:         s = f.required ? z.string().min(1, `${f.label} is required`) : z.string().optional();
    }
    schemaShape[f.name] = s;
  });
  const schema = z.object(schemaShape);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: entry ? Object.fromEntries(fields.map(f => [f.name, (entry as Record<string, unknown>)[f.name] ?? (f.type === 'checkbox' ? false : f.type === 'tags' ? [] : '')])) : Object.fromEntries(fields.map(f => [f.name, f.type === 'checkbox' ? false : f.type === 'tags' ? [] : ''])),
  });

  // Reset when entry changes (switching from add to edit)
  useEffect(() => {
    if (entry) {
      reset(Object.fromEntries(fields.map(f => [f.name, (entry as Record<string, unknown>)[f.name] ?? (f.type === 'checkbox' ? false : f.type === 'tags' ? [] : '')])));
    }
  }, [entry, fields, reset]);

  const watchedValues = watch();

  const onValid = async (data: Record<string, unknown>) => {
    // Strip empty strings to avoid overwriting with blanks on edit
    const cleaned = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== '' && v !== undefined && v !== null)
    );
    const success = await onSubmit(cleaned);
    if (success && !entry) reset(); // clear on successful add
  };

  return (
    <form onSubmit={handleSubmit(onValid)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {fields.map(field => {
          const error = errors[field.name]?.message as string | undefined;
          const isConditionallyRequired = field.requiredWhen?.(watchedValues as Record<string, unknown>);

          // Checkbox spans full width
          if (field.type === 'checkbox') {
            return (
              <div key={field.name} className="sm:col-span-2 flex items-center gap-2">
                <Checkbox
                  id={field.name}
                  checked={!!watchedValues[field.name]}
                  onCheckedChange={(v) => setValue(field.name, !!v)}
                />
                <Label htmlFor={field.name} className="font-normal cursor-pointer">{field.label}</Label>
              </div>
            );
          }

          // Textarea spans full width
          if (field.type === 'textarea') {
            return (
              <div key={field.name} className="sm:col-span-2 space-y-1.5">
                <Label htmlFor={field.name}>
                  {field.label}
                  {(field.required || isConditionallyRequired) && <span className="text-destructive ml-0.5">*</span>}
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

          // Tags spans full width
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

          // Select
          if (field.type === 'select') {
            return (
              <div key={field.name} className="space-y-1.5">
                <Label htmlFor={field.name}>
                  {field.label}
                  {(field.required || isConditionallyRequired) && <span className="text-destructive ml-0.5">*</span>}
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

          // Default: text, email, tel, date, number, url
          return (
            <div key={field.name} className="space-y-1.5">
              <Label htmlFor={field.name}>
                {field.label}
                {(field.required || isConditionallyRequired) && <span className="text-destructive ml-0.5">*</span>}
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
