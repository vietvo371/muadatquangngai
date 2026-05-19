'use client';

import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-3',
};

export function LoadingSpinner({ size = 'md', className, label }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={cn(
          'animate-spin rounded-full border-primary border-t-transparent',
          sizeClasses[size],
          className
        )}
      />
      {label && (
        <p className="text-sm text-gray-500">{label}</p>
      )}
    </div>
  );
}

interface LoadingOverlayProps {
  className?: string;
  label?: string;
}

export function LoadingOverlay({ className, label }: LoadingOverlayProps) {
  return (
    <div className={cn(
      'absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-20 rounded-lg',
      className
    )}>
      <LoadingSpinner size="md" label={label} />
    </div>
  );
}

interface PageLoaderProps {
  label?: string;
}

export function PageLoader({ label = 'Đang tải...' }: PageLoaderProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <LoadingSpinner size="lg" label={label} />
    </div>
  );
}
