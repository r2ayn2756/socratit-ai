// ============================================================================
// STAT CARD COMPONENT
// Consistent stat/metric cards with icons and trend indicators
// ============================================================================

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

export type StatCardColor = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'neutral';

export interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  color?: StatCardColor;
  trend?: {
    direction: 'up' | 'down' | 'stable';
    value: string;
  };
  onClick?: () => void;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  icon: Icon,
  label,
  value,
  color = 'primary',
  trend,
  onClick,
  className,
}) => {
  const colorClasses: Record<
    StatCardColor,
    { bg: string; border: string; icon: string; text: string; label: string }
  > = {
    primary: {
      bg: 'from-primary-50 to-primary-100',
      border: 'border-primary-200',
      icon: 'bg-primary-500',
      text: 'text-primary-900',
      label: 'text-primary-700',
    },
    secondary: {
      bg: 'from-secondary-50 to-secondary-100',
      border: 'border-secondary-200',
      icon: 'bg-secondary-500',
      text: 'text-secondary-900',
      label: 'text-secondary-700',
    },
    success: {
      bg: 'from-green-50 to-green-100',
      border: 'border-green-200',
      icon: 'bg-success',
      text: 'text-green-900',
      label: 'text-green-700',
    },
    warning: {
      bg: 'from-yellow-50 to-yellow-100',
      border: 'border-yellow-200',
      icon: 'bg-warning',
      text: 'text-yellow-900',
      label: 'text-yellow-700',
    },
    error: {
      bg: 'from-red-50 to-red-100',
      border: 'border-red-200',
      icon: 'bg-error',
      text: 'text-red-900',
      label: 'text-red-700',
    },
    neutral: {
      bg: 'from-neutral-50 to-neutral-100',
      border: 'border-neutral-200',
      icon: 'bg-neutral-500',
      text: 'text-neutral-900',
      label: 'text-neutral-700',
    },
  };

  const colors = colorClasses[color];

  const CardContent = (
    <div
      className={cn(
        'p-6 rounded-xl border-2',
        `bg-gradient-to-br ${colors.bg} ${colors.border}`,
        onClick && 'cursor-pointer transition-all duration-200 hover:shadow-md',
        className
      )}
    >
      {/* Icon + Label */}
      <div className="flex items-center gap-3 mb-3">
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', colors.icon)}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <p className={cn('text-sm font-medium', colors.label)}>{label}</p>
      </div>

      {/* Value */}
      <div className={cn('text-3xl font-bold', colors.text)}>{value}</div>

      {/* Trend (optional) */}
      {trend && (
        <div className={cn('text-xs mt-2 flex items-center gap-1', colors.label)}>
          {trend.direction === 'up' && <span>↑</span>}
          {trend.direction === 'down' && <span>↓</span>}
          {trend.direction === 'stable' && <span>→</span>}
          <span>{trend.value}</span>
        </div>
      )}
    </div>
  );

  if (onClick) {
    return (
      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onClick}>
        {CardContent}
      </motion.div>
    );
  }

  return CardContent;
};
