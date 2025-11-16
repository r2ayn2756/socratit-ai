// ============================================================================
// GLASS PANEL COMPONENT
// Premium glass morphism panel for sections and containers
// Extracted from curriculum components for app-wide use
// ============================================================================

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '../../utils/cn';

// ============================================================================
// GLASS CARD
// Smaller glass morphism card with blur effect
// ============================================================================

interface GlassCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'flat';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  hover?: boolean;
  glow?: boolean;
  glowColor?: 'blue' | 'green' | 'purple' | 'pink' | 'red';
  animate?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
  hover = false,
  glow = false,
  glowColor = 'blue',
  animate = true,
  ...motionProps
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10',
  };

  const variantClasses = {
    default: 'bg-white/70 backdrop-blur-xl border border-white/20',
    elevated: 'bg-white/80 backdrop-blur-2xl border border-white/30 shadow-xl',
    flat: 'bg-white/50 backdrop-blur-md border border-white/10',
  };

  const hoverClasses = hover
    ? 'transition-all duration-300 hover:bg-white/80 hover:shadow-2xl hover:scale-[1.02] cursor-pointer'
    : '';

  const glowClasses = glow ? {
    blue: 'shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40',
    green: 'shadow-lg shadow-green-500/20 hover:shadow-green-500/40',
    purple: 'shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40',
    pink: 'shadow-lg shadow-pink-500/20 hover:shadow-pink-500/40',
    red: 'shadow-lg shadow-red-500/20 hover:shadow-red-500/40',
  }[glowColor] : '';

  const combinedClasses = cn(
    variantClasses[variant],
    paddingClasses[padding],
    hoverClasses,
    glowClasses,
    'rounded-2xl',
    className
  );

  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className={combinedClasses}
        {...motionProps}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={combinedClasses}>
      {children}
    </div>
  );
};

// ============================================================================
// GLASS PANEL
// Larger glass panel for sections with header/footer support
// ============================================================================

interface GlassPanelProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
  contentClassName?: string;
  variant?: 'default' | 'elevated';
  noPadding?: boolean;
}

export const GlassPanel: React.FC<GlassPanelProps> = ({
  children,
  title,
  subtitle,
  action,
  className = '',
  contentClassName = '',
  variant = 'default',
  noPadding = false,
}) => {
  const variantClasses = {
    default: 'bg-white/70 backdrop-blur-xl border border-white/20',
    elevated: 'bg-white/80 backdrop-blur-2xl border border-white/30 shadow-xl',
  };

  return (
    <div
      className={cn(
        variantClasses[variant],
        'rounded-3xl overflow-hidden',
        className
      )}
    >
      {(title || subtitle || action) && (
        <div className="px-8 py-6 border-b border-white/10">
          <div className="flex items-start justify-between">
            <div>
              {title && (
                <h3 className="text-2xl font-semibold text-gray-900">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
              )}
            </div>
            {action && <div>{action}</div>}
          </div>
        </div>
      )}
      <div className={cn(!noPadding && 'p-8', contentClassName)}>
        {children}
      </div>
    </div>
  );
};

// ============================================================================
// GLASS SECTION
// Full-width section with glass background
// ============================================================================

interface GlassSectionProps {
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
}

export const GlassSection: React.FC<GlassSectionProps> = ({
  children,
  className = '',
  innerClassName = '',
}) => {
  return (
    <section className={cn('relative', className)}>
      <div className={cn(
        'bg-white/70 backdrop-blur-xl',
        'border-y border-white/20',
        'py-12',
        innerClassName
      )}>
        {children}
      </div>
    </section>
  );
};

export default GlassPanel;
