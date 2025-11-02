// ============================================================================
// EMPTY STATE COMPONENT
// Consistent empty states with helpful messaging and actions
// ============================================================================

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../../utils/cn';

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  variant?: 'default' | 'subtle';
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  message,
  action,
  secondaryAction,
  variant = 'default',
  className,
}) => {
  const isSubtle = variant === 'subtle';

  return (
    <div className={cn('text-center py-8', className)}>
      {/* Icon */}
      <div
        className={cn(
          'w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4',
          isSubtle ? 'bg-neutral-50' : 'bg-primary-50'
        )}
      >
        <Icon className={cn('w-8 h-8', isSubtle ? 'text-neutral-400' : 'text-primary-500')} />
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-neutral-900 mb-2">{title}</h3>

      {/* Message */}
      <p className="text-sm text-neutral-600 mb-6 max-w-sm mx-auto">{message}</p>

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {action && (
            <Button
              variant="primary"
              onClick={action.onClick}
              icon={action.icon ? <action.icon /> : undefined}
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="ghost" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
