// ============================================================================
// UNIT CARD COMPONENT
// Beautiful card displaying curriculum unit information
// ============================================================================

import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Target, TrendingUp } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { ProgressBar } from './ProgressBar';
import type { CurriculumUnit, UnitCardData } from '../../types/curriculum.types';
import {
  DIFFICULTY_CONFIGS,
  UNIT_TYPE_CONFIGS,
} from '../../config/curriculum.config';
import { format } from 'date-fns';

interface UnitCardProps {
  unit: UnitCardData;
  onClick?: () => void;
  onDragStart?: (unit: CurriculumUnit) => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
  showProgress?: boolean;
  compact?: boolean;
  className?: string;
}

export const UnitCard: React.FC<UnitCardProps> = ({
  unit,
  onClick,
  onDragStart,
  onDragEnd,
  isDragging = false,
  showProgress = true,
  compact = false,
  className = '',
}) => {
  const difficultyConfig = DIFFICULTY_CONFIGS[unit.difficultyLevel];
  const unitTypeConfig = UNIT_TYPE_CONFIGS[unit.unitType];

  // Determine status color
  const getStatusColor = () => {
    if (unit.isCurrentUnit) return 'blue';
    if (unit.status === 'COMPLETED') return 'green';
    if (unit.isPastDue) return 'red';
    if (unit.status === 'IN_PROGRESS') return 'blue';
    return 'gray';
  };

  const statusColor = getStatusColor();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{
        opacity: isDragging ? 0.5 : 1,
        y: 0,
        scale: isDragging ? 0.95 : 1,
      }}
      exit={{ opacity: 0, y: -20 }}
      transition={{
        layout: { duration: 0.3 },
        opacity: { duration: 0.2 },
      }}
      className={className}
      draggable={!!onDragStart}
      onDragStart={() => onDragStart?.(unit)}
      onDragEnd={onDragEnd}
    >
      <GlassCard
        variant={unit.isCurrentUnit ? 'elevated' : 'default'}
        padding={compact ? 'md' : 'lg'}
        hover={!!onClick}
        glow={unit.isCurrentUnit}
        glowColor={statusColor}
        onClick={onClick}
        className={`
          relative overflow-hidden
          ${unit.isCurrentUnit ? 'ring-2 ring-blue-500/30' : ''}
        `}
      >
        {/* Current unit indicator */}
        {unit.isCurrentUnit && (
          <div className="absolute top-0 right-0 px-3 py-1 bg-blue-500 text-white text-xs font-semibold rounded-bl-lg">
            Current
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{unitTypeConfig.icon}</span>
              <span className={`
                px-2 py-1 rounded-lg text-xs font-semibold
                bg-${difficultyConfig.color}-100
                text-${difficultyConfig.color}-700
              `}>
                {difficultyConfig.label}
              </span>
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-1">
              Unit {unit.unitNumber}: {unit.title}
            </h3>

            {!compact && unit.description && (
              <p className="text-sm text-gray-600 line-clamp-2">
                {unit.description}
              </p>
            )}
          </div>
        </div>

        {/* Dates */}
        <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{format(new Date(unit.startDate), 'MMM d')}</span>
          </div>
          <span>→</span>
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{format(new Date(unit.endDate), 'MMM d')}</span>
          </div>
          <div className="flex items-center gap-1 ml-auto">
            <Clock className="w-4 h-4" />
            <span>{unit.estimatedWeeks}w</span>
          </div>
        </div>

        {/* Progress */}
        {showProgress && (
          <div className="mb-4">
            <ProgressBar
              progress={unit.percentComplete}
              color={
                unit.percentComplete >= 90 ? 'green' :
                unit.percentComplete >= 50 ? 'blue' :
                'orange'
              }
              size="md"
              showPercentage
              animated
            />
          </div>
        )}

        {/* Topics */}
        {!compact && unit.topics.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Target className="w-4 h-4" />
              <span>Key Topics</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {unit.topics.slice(0, 3).map((topic, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-white/50 backdrop-blur-sm rounded-full text-xs text-gray-700 border border-gray-200/50"
                >
                  {topic.name}
                </span>
              ))}
              {unit.topics.length > 3 && (
                <span className="px-3 py-1 bg-white/50 backdrop-blur-sm rounded-full text-xs text-gray-500 border border-gray-200/50">
                  +{unit.topics.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Learning Objectives Count */}
        {!compact && (
          <div className="mt-4 pt-4 border-t border-gray-200/50 flex items-center justify-between text-xs text-gray-600">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                <span>{unit.learningObjectives.length} objectives</span>
              </div>
              <div>
                {unit.concepts.length} concepts
              </div>
            </div>
            {unit.teacherModified && (
              <span className="text-blue-600 font-medium">
                ✏️ Modified
              </span>
            )}
          </div>
        )}
      </GlassCard>
    </motion.div>
  );
};

// ============================================================================
// COMPACT UNIT CARD
// Smaller version for lists
// ============================================================================

export const CompactUnitCard: React.FC<UnitCardProps> = (props) => {
  return <UnitCard {...props} compact />;
};

export default UnitCard;
