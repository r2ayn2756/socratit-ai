// ============================================================================
// BADGE COMPONENT
// Status badges for UI indicators with premium glass morphism variants
// ============================================================================

import React, { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../utils/cn';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'primary' | 'purple' | 'pink' | 'glass' | 'glassSuccess' | 'glassWarning';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  withBorder?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  size = 'md',
  className = '',
  children,
  withBorder = false,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center font-medium rounded-full transition-all duration-200';

  const variantClasses = {
    success: cn(
      'bg-green-100 text-green-700',
      withBorder && 'border border-green-300'
    ),
    warning: cn(
      'bg-yellow-100 text-yellow-700',
      withBorder && 'border border-yellow-300'
    ),
    error: cn(
      'bg-red-100 text-red-700',
      withBorder && 'border border-red-300'
    ),
    info: cn(
      'bg-cyan-100 text-cyan-700',
      withBorder && 'border border-cyan-300'
    ),
    neutral: cn(
      'bg-slate-100 text-slate-700',
      withBorder && 'border border-slate-300'
    ),
    primary: cn(
      'bg-blue-100 text-blue-700',
      withBorder && 'border border-blue-300'
    ),
    purple: cn(
      'bg-purple-100 text-purple-700',
      withBorder && 'border border-purple-300'
    ),
    pink: cn(
      'bg-pink-100 text-pink-700',
      withBorder && 'border border-pink-300'
    ),
    glass: cn(
      'bg-white/50 backdrop-blur-md text-gray-700',
      'border border-white/20'
    ),
    glassSuccess: cn(
      'bg-green-50/70 backdrop-blur-md text-green-700',
      'border border-green-200/50'
    ),
    glassWarning: cn(
      'bg-yellow-50/70 backdrop-blur-md text-yellow-700',
      'border border-yellow-200/50'
    ),
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  const combinedClasses = cn(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    className
  );

  return (
    <span className={combinedClasses} {...props}>
      {children}
    </span>
  );
};
