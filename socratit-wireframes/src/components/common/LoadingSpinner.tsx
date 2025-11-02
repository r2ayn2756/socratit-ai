// ============================================================================
// LOADING SPINNER COMPONENT
// Consistent loading states across the application
// ============================================================================

import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

export type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';

export interface LoadingSpinnerProps {
  size?: SpinnerSize;
  message?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  message,
  className,
}) => {
  const sizeClasses: Record<SpinnerSize, string> = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center', className)}>
      <Loader2 className={cn(sizeClasses[size], 'text-primary-600 animate-spin')} />
      {message && <p className="mt-4 text-sm text-neutral-600">{message}</p>}
    </div>
  );
};
