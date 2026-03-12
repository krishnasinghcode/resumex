import { AlertCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ErrorBannerProps {
  message:    string;
  onDismiss?: () => void;
  className?: string;
}

export function ErrorBanner({ message, onDismiss, className }: ErrorBannerProps) {
  return (
    <div className={cn('flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive', className)}>
      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <span className="flex-1">{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="hover:opacity-70 transition-opacity flex-shrink-0">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
