// ============================================================================
// CARD COMPONENT
// Flexible card with multiple variants using design tokens
// Updated with premium glass morphism variants
// ============================================================================

import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

export type CardVariant = 'default' | 'elevated' | 'ghost' | 'glass' | 'glassElevated';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg' | 'xl';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: CardPadding;
  hover?: boolean;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  glow?: boolean;
  glowColor?: 'blue' | 'green' | 'purple' | 'pink' | 'red';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({
    variant = 'default',
    padding = 'md',
    hover = false,
    className,
    children,
    onClick,
    glow = false,
    glowColor = 'blue',
    ...props
  }, ref) => {
    // Base classes
    const baseClasses = 'rounded-xl transition-all duration-200';

    // Variant classes (using premium design tokens)
    const variantClasses: Record<CardVariant, string> = {
      default: 'bg-white border border-neutral-200 shadow-sm',
      elevated: 'bg-white border border-neutral-200 shadow-lg',
      ghost: 'bg-white/80 backdrop-blur-xl border border-neutral-200/50 shadow-sm',
      glass: 'bg-white/70 backdrop-blur-xl border border-white/20 shadow-md',
      glassElevated: 'bg-white/80 backdrop-blur-2xl border border-white/30 shadow-xl',
    };

    // Padding classes (using new spacing system)
    const paddingClasses: Record<CardPadding, string> = {
      none: 'p-0',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
      xl: 'p-10',
    };

    // Glow effects (premium colored shadows)
    const glowClasses = glow ? {
      blue: 'shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30',
      green: 'shadow-lg shadow-green-500/20 hover:shadow-green-500/30',
      purple: 'shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30',
      pink: 'shadow-lg shadow-pink-500/20 hover:shadow-pink-500/30',
      red: 'shadow-lg shadow-red-500/20 hover:shadow-red-500/30',
    }[glowColor] : '';

    // Hover effect
    const hoverClass = hover ? 'cursor-pointer hover:shadow-xl hover:-translate-y-1' : '';

    const combinedClasses = cn(
      baseClasses,
      variantClasses[variant],
      paddingClasses[padding],
      hoverClass,
      glowClasses,
      className
    );

    if (hover) {
      return (
        <motion.div
          ref={ref}
          className={combinedClasses}
          onClick={onClick}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          whileHover={{
            y: -4,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          }}
        >
          {children}
        </motion.div>
      );
    }

    return (
      <div ref={ref} className={combinedClasses} onClick={onClick} {...props}>
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

// ============================================================================
// CARD SUB-COMPONENTS
// For better structured cards
// ============================================================================

export interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className }) => (
  <div className={cn('mb-4', className)}>{children}</div>
);

export interface CardContentProps {
  children: ReactNode;
  className?: string;
}

export const CardContent: React.FC<CardContentProps> = ({ children, className }) => (
  <div className={cn(className)}>{children}</div>
);

export interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

export const CardFooter: React.FC<CardFooterProps> = ({ children, className }) => (
  <div className={cn('mt-4 pt-4 border-t border-neutral-200', className)}>{children}</div>
);
