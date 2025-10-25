// ============================================================================
// CARD COMPONENT
// Flexible card with glassmorphism and neumorphism variants
// ============================================================================

import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';

export interface CardProps {
  variant?: 'default' | 'glass' | 'neumorphism' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  padding = 'md',
  hover = false,
  className = '',
  children,
  onClick,
}) => {
  const baseClasses = 'rounded-xl transition-all duration-300';

  const variantClasses = {
    default: 'bg-white border border-slate-200 shadow-sm',
    glass: 'glass border-white/20',
    neumorphism: 'bg-slate-50 neumorphism',
    elevated: 'bg-white shadow-xl shadow-slate-200/50',
  };

  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const hoverClasses = hover
    ? 'cursor-pointer hover:shadow-2xl hover:-translate-y-1'
    : '';

  const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${paddingClasses[padding]} ${hoverClasses} ${className}`;

  if (hover) {
    return (
      <motion.div
        className={combinedClasses}
        onClick={onClick}
        whileHover={{ y: -4, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={combinedClasses} onClick={onClick}>
      {children}
    </div>
  );
};

// Card sub-components for better structure
export const CardHeader: React.FC<{ children: ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`mb-4 ${className}`}>{children}</div>
);

export const CardContent: React.FC<{ children: ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={className}>{children}</div>
);

export const CardFooter: React.FC<{ children: ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`mt-4 pt-4 border-t border-slate-200 ${className}`}>{children}</div>
);
