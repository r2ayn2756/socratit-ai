// ============================================================================
// UNIFIED BUTTON COMPONENT
// Production-ready button with multiple variants and states
// Merged from common/Button.tsx and curriculum/Button.tsx
// ============================================================================

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type IconPosition = 'left' | 'right';

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
  iconPosition?: IconPosition;
  fullWidth?: boolean;
  className?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      loading = false,
      loadingText,
      icon,
      iconPosition = 'left',
      fullWidth = false,
      className,
      disabled,
      type = 'button',
      ...motionProps
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    // Base classes
    const baseClasses = cn(
      'inline-flex items-center justify-center',
      'font-medium transition-all duration-200',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
      fullWidth && 'w-full'
    );

    // Variant classes (using new design tokens)
    const variantClasses: Record<ButtonVariant, string> = {
      primary: cn(
        'bg-primary-600 text-white',
        'hover:bg-primary-700 active:bg-primary-800',
        'focus-visible:ring-primary-500',
        'shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40'
      ),
      secondary: cn(
        'bg-white text-primary-700 border-2 border-primary-600',
        'hover:bg-primary-50 active:bg-primary-100',
        'focus-visible:ring-primary-500',
        'shadow-sm'
      ),
      ghost: cn(
        'bg-transparent text-neutral-700 border border-neutral-300',
        'hover:bg-neutral-50 active:bg-neutral-100',
        'focus-visible:ring-neutral-400'
      ),
      danger: cn(
        'bg-error text-white',
        'hover:bg-red-700 active:bg-red-800',
        'focus-visible:ring-red-500',
        'shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40'
      ),
      success: cn(
        'bg-success text-white',
        'hover:bg-green-700 active:bg-green-800',
        'focus-visible:ring-green-500',
        'shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40'
      ),
    };

    // Size classes (using new spacing system)
    const sizeClasses: Record<ButtonSize, string> = {
      sm: 'px-4 py-2 text-sm gap-2 rounded-lg',
      md: 'px-6 py-3 text-base gap-3 rounded-lg',
      lg: 'px-8 py-4 text-lg gap-3 rounded-lg',
    };

    // Icon sizes
    const iconSizes: Record<ButtonSize, string> = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
    };

    const iconContent = loading ? (
      <Loader2 className={cn(iconSizes[size], 'animate-spin')} />
    ) : icon ? (
      <span className={cn('flex-shrink-0', iconSizes[size])}>{icon}</span>
    ) : null;

    return (
      <motion.button
        ref={ref}
        type={type}
        whileHover={{ scale: isDisabled ? 1 : 1.02 }}
        whileTap={{ scale: isDisabled ? 1 : 0.98 }}
        disabled={isDisabled}
        className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)}
        {...motionProps}
      >
        {iconPosition === 'left' && iconContent}
        <span>{loading && loadingText ? loadingText : children}</span>
        {iconPosition === 'right' && iconContent}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

export { Button };

// ============================================================================
// ICON BUTTON
// Circular button for icons
// ============================================================================

export interface IconButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  icon: React.ReactNode;
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  tooltip?: string;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, variant = 'secondary', size = 'md', className, tooltip, disabled, ...motionProps }, ref) => {
    const variantClasses: Record<ButtonVariant, string> = {
      primary: cn(
        'bg-primary-600 text-white',
        'hover:bg-primary-700 active:bg-primary-800',
        'shadow-md shadow-primary-500/30'
      ),
      secondary: cn(
        'bg-white/70 backdrop-blur-xl text-neutral-900',
        'border border-neutral-200',
        'hover:bg-white/90',
        'shadow-sm'
      ),
      ghost: cn('bg-transparent text-neutral-700', 'hover:bg-neutral-100'),
      danger: cn(
        'bg-error text-white',
        'hover:bg-red-700 active:bg-red-800',
        'shadow-md shadow-red-500/30'
      ),
      success: cn(
        'bg-success text-white',
        'hover:bg-green-700 active:bg-green-800',
        'shadow-md shadow-green-500/30'
      ),
    };

    const sizeMap: Record<'sm' | 'md' | 'lg', string> = {
      sm: 'w-8 h-8',
      md: 'w-10 h-10',
      lg: 'w-12 h-12',
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: disabled ? 1 : 1.05 }}
        whileTap={{ scale: disabled ? 1 : 0.95 }}
        disabled={disabled}
        className={cn(
          variantClasses[variant],
          sizeMap[size],
          'rounded-full flex items-center justify-center',
          'transition-all duration-200',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        title={tooltip}
        aria-label={tooltip}
        {...motionProps}
      >
        {icon}
      </motion.button>
    );
  }
);

IconButton.displayName = 'IconButton';

// ============================================================================
// BUTTON GROUP
// Group of buttons
// ============================================================================

export interface ButtonGroupProps {
  children: React.ReactNode;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

export const ButtonGroup: React.FC<ButtonGroupProps> = ({
  children,
  className,
  orientation = 'horizontal',
}) => {
  return (
    <div
      className={cn(
        'inline-flex gap-2',
        orientation === 'horizontal' ? 'flex-row' : 'flex-col',
        className
      )}
    >
      {children}
    </div>
  );
};

export default Button;
