// ============================================================================
// BADGE COMPONENT
// Status badges for UI indicators
// ============================================================================

import React, { HTMLAttributes, ReactNode } from 'react';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'primary' | 'purple';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  size = 'md',
  className = '',
  children,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center font-medium rounded-full';

  const variantClasses = {
    success: 'bg-green-100 text-green-700',
    warning: 'bg-amber-100 text-amber-700',
    error: 'bg-red-100 text-red-700',
    info: 'bg-cyan-100 text-cyan-700',
    neutral: 'bg-slate-100 text-slate-700',
    primary: 'bg-blue-100 text-brand-blue',
    purple: 'bg-purple-100 text-brand-purple',
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  return (
    <span className={combinedClasses} {...props}>
      {children}
    </span>
  );
};
