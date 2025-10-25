// ============================================================================
// STAT CARD COMPONENT
// Colorful statistics card with icon and metrics
// ============================================================================

import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'blue' | 'purple' | 'orange' | 'green' | 'cyan' | 'pink' | 'red';
  subtitle?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend,
  color = 'blue',
  subtitle,
  onClick,
}) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
    green: 'from-green-500 to-green-600',
    cyan: 'from-cyan-400 to-cyan-500',
    pink: 'from-pink-500 to-pink-600',
    red: 'from-red-500 to-red-600',
  };

  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-2xl p-6
        bg-gradient-to-br ${colorClasses[color]}
        text-white shadow-lg
        ${onClick ? 'cursor-pointer' : ''}
        transition-shadow duration-300
      `}
    >
      {/* Background Pattern */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full -ml-12 -mb-12"></div>

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            {icon}
          </div>

          {trend && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
              trend.isPositive ? 'bg-white/20' : 'bg-black/20'
            }`}>
              {trend.isPositive ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span className="text-sm font-semibold">{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>

        <div className="text-3xl font-bold mb-1">{value}</div>
        <div className="text-white/80 text-sm font-medium">{title}</div>
        {subtitle && (
          <div className="text-white/60 text-xs mt-1">{subtitle}</div>
        )}
      </div>
    </motion.div>
  );
};
