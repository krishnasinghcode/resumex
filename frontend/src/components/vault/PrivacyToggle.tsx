import { Lock, Unlock } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface PrivacyToggleProps {
  isPrivate:  boolean;
  onChange:   (val: boolean) => void;
  label?:     string;
  size?:      'sm' | 'md';
  disabled?:  boolean;
}

export function PrivacyToggle({ isPrivate, onChange, label, size = 'md', disabled = false }: PrivacyToggleProps) {
  return (
    <div className={cn('flex items-center gap-2', size === 'sm' && 'gap-1.5')}>
      {isPrivate
        ? <Lock   className={cn('text-amber-500', size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4')} />
        : <Unlock className={cn('text-muted-foreground/50', size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4')} />
      }
      <Switch
        checked={isPrivate}
        onCheckedChange={onChange}
        disabled={disabled}
        className={cn(isPrivate && 'data-[state=checked]:bg-amber-500')}
      />
      {label && (
        <span className={cn('text-muted-foreground', size === 'sm' ? 'text-xs' : 'text-sm')}>
          {label}
        </span>
      )}
    </div>
  );
}
