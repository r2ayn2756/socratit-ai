// ============================================================================
// LETTER GRADE BADGE COMPONENT
// Beautiful badge for displaying letter grades with colors
// ============================================================================

import React from 'react';
import { motion } from 'framer-motion';
import { LetterGrade, formatLetterGrade, getGradeColor } from '../../types/grade.types';

interface LetterGradeBadgeProps {
  grade: LetterGrade;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
  animated?: boolean;
}

export const LetterGradeBadge: React.FC<LetterGradeBadgeProps> = ({
  grade,
  size = 'md',
  showLabel = false,
  animated = true,
}) => {
  const colorMap = {
    green: {
      bg: 'from-green-500 to-green-600',
      text: 'text-white',
      shadow: 'shadow-green-500/30',
    },
    blue: {
      bg: 'from-blue-500 to-blue-600',
      text: 'text-white',
      shadow: 'shadow-blue-500/30',
    },
    yellow: {
      bg: 'from-yellow-400 to-yellow-500',
      text: 'text-slate-900',
      shadow: 'shadow-yellow-500/30',
    },
    orange: {
      bg: 'from-orange-500 to-orange-600',
      text: 'text-white',
      shadow: 'shadow-orange-500/30',
    },
    red: {
      bg: 'from-red-500 to-red-600',
      text: 'text-white',
      shadow: 'shadow-red-500/30',
    },
  };

  const sizeClasses = {
    sm: 'w-10 h-10 text-sm',
    md: 'w-14 h-14 text-lg',
    lg: 'w-20 h-20 text-2xl',
    xl: 'w-28 h-28 text-4xl',
  };

  const color = getGradeColor(grade);
  const colors = colorMap[color as keyof typeof colorMap];
  const formattedGrade = formatLetterGrade(grade);

  const BadgeContent = (
    <div
      className={`
        ${sizeClasses[size]}
        bg-gradient-to-br ${colors.bg}
        ${colors.text} ${colors.shadow}
        rounded-2xl shadow-xl
        flex items-center justify-center
        font-bold
        relative overflow-hidden
      `}
    >
      {/* Shine effect */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/20 to-transparent"></div>

      {/* Grade text */}
      <span className="relative z-10">{formattedGrade}</span>
    </div>
  );

  return (
    <div className="inline-flex flex-col items-center gap-2">
      {animated ? (
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          whileHover={{ scale: 1.1, rotate: 5 }}
        >
          {BadgeContent}
        </motion.div>
      ) : (
        BadgeContent
      )}

      {showLabel && (
        <span className="text-xs font-medium text-slate-600">Letter Grade</span>
      )}
    </div>
  );
};
