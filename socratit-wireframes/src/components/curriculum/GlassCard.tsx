// ============================================================================
// GLASS CARD COMPONENT
// Apple-style glass morphism card with blur effect
// ============================================================================

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface GlassCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'flat';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  hover?: boolean;
  glow?: boolean;
  glowColor?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
  hover = false,
  glow = false,
  glowColor = 'blue',
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

  const glowClasses = glow
    ? `shadow-lg shadow-${glowColor}-500/20 hover:shadow-${glowColor}-500/40`
    : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className={`
        ${variantClasses[variant]}
        ${paddingClasses[padding]}
        ${hoverClasses}
        ${glowClasses}
        rounded-2xl
        ${className}
      `}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
};

// ============================================================================
// GLASS PANEL COMPONENT
// Larger glass panel for sections
// ============================================================================

interface GlassPanelProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

export const GlassPanel: React.FC<GlassPanelProps> = ({
  children,
  title,
  subtitle,
  action,
  className = '',
  contentClassName = '',
}) => {
  return (
    <div
      className={`
        bg-white/70 backdrop-blur-xl
        border border-white/20
        rounded-3xl
        overflow-hidden
        ${className}
      `}
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
      <div className={`p-8 ${contentClassName}`}>{children}</div>
    </div>
  );
};

export default GlassCard;
