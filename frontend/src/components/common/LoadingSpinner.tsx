import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  fullPage?: boolean;
}

export function LoadingSpinner({ size = 'md', className, fullPage = false }: LoadingSpinnerProps) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' };

  const spinner = (
    <div
      className={cn(
        'border-2 border-current border-t-transparent rounded-full animate-spin text-primary',
        sizes[size],
        className
      )}
    />
  );

  if (fullPage) {
    return (
      <div className="flex items-center justify-center min-h-[400px] w-full">
        {spinner}
      </div>
    );
  }

  return spinner;
}
