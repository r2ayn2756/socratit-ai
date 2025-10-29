// ============================================================================
// PROGRESS BAR COMPONENT
// Smooth animated progress bar with glass morphism
// ============================================================================

import React from 'react';
import { motion } from 'framer-motion';

interface ProgressBarProps {
  progress: number; // 0-100
  label?: string;
  showPercentage?: boolean;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'emerald';
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  className?: string;
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-500',
    glow: 'shadow-blue-500/30',
    gradient: 'from-blue-400 to-blue-600',
  },
  green: {
    bg: 'bg-green-500',
    glow: 'shadow-green-500/30',
    gradient: 'from-green-400 to-green-600',
  },
  purple: {
    bg: 'bg-purple-500',
    glow: 'shadow-purple-500/30',
    gradient: 'from-purple-400 to-purple-600',
  },
  orange: {
    bg: 'bg-orange-500',
    glow: 'shadow-orange-500/30',
    gradient: 'from-orange-400 to-orange-600',
  },
  red: {
    bg: 'bg-red-500',
    glow: 'shadow-red-500/30',
    gradient: 'from-red-400 to-red-600',
  },
  emerald: {
    bg: 'bg-emerald-500',
    glow: 'shadow-emerald-500/30',
    gradient: 'from-emerald-400 to-emerald-600',
  },
};

const sizeClasses = {
  sm: 'h-2',
  md: 'h-3',
  lg: 'h-4',
};

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  label,
  showPercentage = false,
  color = 'blue',
  size = 'md',
  animated = true,
  className = '',
}) => {
  const clampedProgress = Math.max(0, Math.min(100, progress));
  const colors = colorClasses[color];

  return (
    <div className={`w-full ${className}`}>
      {(label || showPercentage) && (
        <div className="flex items-center justify-between mb-2">
          {label && (
            <span className="text-sm font-medium text-gray-700">{label}</span>
          )}
          {showPercentage && (
            <span className="text-sm font-semibold text-gray-900">
              {Math.round(clampedProgress)}%
            </span>
          )}
        </div>
      )}

      <div className={`
        relative
        ${sizeClasses[size]}
        bg-gray-200/50
        backdrop-blur-sm
        rounded-full
        overflow-hidden
      `}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${clampedProgress}%` }}
          transition={{
            duration: animated ? 0.8 : 0,
            ease: [0.4, 0, 0.2, 1],
          }}
          className={`
            absolute
            inset-y-0
            left-0
            bg-gradient-to-r
            ${colors.gradient}
            shadow-lg
            ${colors.glow}
            rounded-full
          `}
        >
          {/* Animated shimmer effect */}
          {animated && clampedProgress > 0 && (
            <motion.div
              animate={{
                x: ['-100%', '100%'],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'linear',
              }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            />
          )}
        </motion.div>
      </div>
    </div>
  );
};

// ============================================================================
// CIRCULAR PROGRESS COMPONENT
// Apple-style circular progress indicator
// ============================================================================

interface CircularProgressProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'emerald';
  showPercentage?: boolean;
  label?: string;
  className?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  progress,
  size = 120,
  strokeWidth = 8,
  color = 'blue',
  showPercentage = true,
  label,
  className = '',
}) => {
  const clampedProgress = Math.max(0, Math.min(100, progress));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clampedProgress / 100) * circumference;

  const colors = colorClasses[color];

  return (
    <div className={`relative inline-flex flex-col items-center ${className}`}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200"
        />

        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#gradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{
            duration: 0.8,
            ease: [0.4, 0, 0.2, 1],
          }}
        />

        {/* Gradient definition */}
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" className={colors.bg} />
            <stop offset="100%" className={colors.bg} style={{ opacity: 0.6 }} />
          </linearGradient>
        </defs>
      </svg>

      {/* Center content */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center"
        style={{ width: size, height: size }}
      >
        {showPercentage && (
          <span className="text-2xl font-bold text-gray-900">
            {Math.round(clampedProgress)}%
          </span>
        )}
        {label && (
          <span className="text-xs text-gray-500 mt-1">{label}</span>
        )}
      </div>
    </div>
  );
};

export default ProgressBar;
