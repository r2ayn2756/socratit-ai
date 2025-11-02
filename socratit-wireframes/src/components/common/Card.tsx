// ============================================================================
// CARD COMPONENT
// Flexible card with multiple variants using design tokens
// ============================================================================

import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

export type CardVariant = 'default' | 'elevated' | 'ghost';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: CardPadding;
  hover?: boolean;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'default', padding = 'md', hover = false, className, children, onClick, ...props }, ref) => {
    // Base classes
    const baseClasses = 'rounded-xl transition-all duration-200';

    // Variant classes (using new design tokens)
    const variantClasses: Record<CardVariant, string> = {
      default: 'bg-white border border-neutral-200 shadow-sm',
      elevated: 'bg-white border border-neutral-200 shadow-lg',
      ghost: 'bg-white/80 backdrop-blur-xl border border-neutral-200/50 shadow-sm',
    };

    // Padding classes (using new spacing system)
    const paddingClasses: Record<CardPadding, string> = {
      none: 'p-0',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    };

    // Hover effect
    const hoverClass = hover ? 'cursor-pointer hover:shadow-lg hover:-translate-y-1' : '';

    const combinedClasses = cn(
      baseClasses,
      variantClasses[variant],
      paddingClasses[padding],
      hoverClass,
      className
    );

    if (hover) {
      return (
        <motion.div
          ref={ref}
          className={combinedClasses}
          onClick={onClick}
          whileHover={{
            y: -4,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          }}
          {...props}
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
