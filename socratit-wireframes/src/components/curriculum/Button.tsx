// ============================================================================
// BUTTON COMPONENT
// Apple-style buttons with glass morphism
// ============================================================================

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  className?: string;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: `
    bg-gradient-to-r from-blue-500 to-blue-600
    hover:from-blue-600 hover:to-blue-700
    text-white
    shadow-lg shadow-blue-500/30
    hover:shadow-xl hover:shadow-blue-500/40
  `,
  secondary: `
    bg-white/70 backdrop-blur-xl
    border border-white/20
    text-gray-900
    hover:bg-white/90
    shadow-md
  `,
  ghost: `
    bg-transparent
    text-gray-700
    hover:bg-white/50
  `,
  danger: `
    bg-gradient-to-r from-red-500 to-red-600
    hover:from-red-600 hover:to-red-700
    text-white
    shadow-lg shadow-red-500/30
    hover:shadow-xl hover:shadow-red-500/40
  `,
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  className = '',
  disabled,
  ...motionProps
}) => {
  const isDisabled = disabled || loading;

  return (
    <motion.button
      whileHover={{ scale: isDisabled ? 1 : 1.02 }}
      whileTap={{ scale: isDisabled ? 1 : 0.98 }}
      className={`
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        rounded-xl
        font-medium
        transition-all duration-200
        flex items-center justify-center gap-2
        ${className}
      `}
      disabled={isDisabled}
      {...motionProps}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {!loading && icon && iconPosition === 'left' && icon}
      {children}
      {!loading && icon && iconPosition === 'right' && icon}
    </motion.button>
  );
};

// ============================================================================
// ICON BUTTON
// Circular button for icons
// ============================================================================

interface IconButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  icon: React.ReactNode;
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  tooltip?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  variant = 'secondary',
  size = 'md',
  className = '',
  tooltip,
  ...motionProps
}) => {
  const sizeMap = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`
        ${variantClasses[variant]}
        ${sizeMap[size]}
        rounded-full
        flex items-center justify-center
        transition-all duration-200
        ${className}
      `}
      title={tooltip}
      {...motionProps}
    >
      {icon}
    </motion.button>
  );
};

// ============================================================================
// BUTTON GROUP
// Group of buttons
// ============================================================================

interface ButtonGroupProps {
  children: React.ReactNode;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

export const ButtonGroup: React.FC<ButtonGroupProps> = ({
  children,
  className = '',
  orientation = 'horizontal',
}) => {
  return (
    <div
      className={`
        inline-flex
        ${orientation === 'horizontal' ? 'flex-row' : 'flex-col'}
        gap-2
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default Button;
