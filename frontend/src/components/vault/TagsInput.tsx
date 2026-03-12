import { useState, KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface TagsInputProps {
  value:        string[];
  onChange:     (tags: string[]) => void;
  placeholder?: string;
  className?:   string;
}

export function TagsInput({ value, onChange, placeholder, className }: TagsInputProps) {
  const [input, setInput] = useState('');

  const add = () => {
    const tag = input.trim();
    if (tag && !value.includes(tag)) {
      onChange([...value, tag]);
    }
    setInput('');
  };

  const remove = (tag: string) => onChange(value.filter(t => t !== tag));

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      add();
    }
    if (e.key === 'Backspace' && !input && value.length) {
      remove(value[value.length - 1]);
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      <Input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={add}
        placeholder={placeholder ?? 'Type and press Enter…'}
      />
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map(tag => (
            <span key={tag} className="tag-chip">
              {tag}
              <button type="button" onClick={() => remove(tag)} className="hover:opacity-70 transition-opacity">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
