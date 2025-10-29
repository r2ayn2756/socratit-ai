// ============================================================================
// CURRICULUM SECTION COMPONENT
// Displays curriculum schedule in class dashboard
// ============================================================================

import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Calendar, ArrowRight, Settings } from 'lucide-react';
import { CollapsibleSection } from './CollapsibleSection';
import { Button } from '../curriculum/Button';
import { ProgressBar } from '../curriculum/ProgressBar';
import type { CurriculumUnit, CurriculumSchedule } from '../../types/curriculum.types';
import { format } from 'date-fns';

interface CurriculumSectionProps {
  schedule: CurriculumSchedule | null;
  currentUnit?: CurriculumUnit;
  upcomingUnits?: CurriculumUnit[];
  onManageClick?: () => void;
  onUnitClick?: (unit: CurriculumUnit) => void;
}

export const CurriculumSection: React.FC<CurriculumSectionProps> = ({
  schedule,
  currentUnit,
  upcomingUnits = [],
  onManageClick,
  onUnitClick,
}) => {
  if (!schedule) {
    // No curriculum setup
    return (
      <CollapsibleSection
        title="Curriculum Schedule"
        subtitle="No curriculum schedule created"
        icon={<BookOpen className="w-5 h-5 text-white" />}
        defaultExpanded={true}
      >
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-600 mb-4">
            No curriculum schedule has been created for this class yet.
          </p>
          <Button
            variant="primary"
            onClick={onManageClick}
            icon={<Calendar className="w-4 h-4" />}
          >
            Create Curriculum Schedule
          </Button>
        </div>
      </CollapsibleSection>
    );
  }

  return (
    <CollapsibleSection
      title="Curriculum Schedule"
      subtitle={`${schedule.completedUnits} of ${schedule.totalUnits} units completed`}
      icon={<BookOpen className="w-5 h-5 text-white" />}
      defaultExpanded={true}
      action={
        <Button
          variant="ghost"
          size="sm"
          onClick={onManageClick}
          icon={<Settings className="w-4 h-4" />}
        >
          Manage Full Schedule
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Overall Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Overall Progress</span>
            <span className="text-sm font-semibold text-blue-600">
              {schedule.percentComplete}%
            </span>
          </div>
          <ProgressBar
            progress={schedule.percentComplete}
            color="blue"
            size="lg"
            animated
          />
        </div>

        {/* Current Unit Card */}
        {currentUnit && (
          <motion.div
            whileHover={{ scale: 1.01 }}
            onClick={() => onUnitClick?.(currentUnit)}
            className="p-5 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-300 cursor-pointer"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="px-2 py-1 rounded-md bg-blue-500 text-white text-xs font-semibold">
                  CURRENT
                </div>
                <h4 className="font-semibold text-gray-900">
                  Unit {currentUnit.unitNumber}: {currentUnit.title}
                </h4>
              </div>
            </div>

            <p className="text-sm text-gray-700 mb-3 line-clamp-2">
              {currentUnit.description}
            </p>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {format(new Date(currentUnit.startDate), 'MMM d')} -{' '}
                    {format(new Date(currentUnit.endDate), 'MMM d')}
                  </span>
                </div>
                <div className="px-2 py-1 rounded-md bg-white/70 text-gray-700 font-medium">
                  {currentUnit.estimatedWeeks} weeks
                </div>
              </div>

              {currentUnit.percentComplete !== undefined && (
                <div className="text-blue-600 font-semibold">
                  {currentUnit.percentComplete}% complete
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Upcoming Units Preview */}
        {upcomingUnits.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">
              Upcoming Units
            </h4>
            <div className="space-y-2">
              {upcomingUnits.slice(0, 3).map((unit) => (
                <motion.div
                  key={unit.id}
                  whileHover={{ x: 4 }}
                  onClick={() => onUnitClick?.(unit)}
                  className="p-3 rounded-lg bg-white/70 border border-gray-200 hover:border-blue-300 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">
                        Unit {unit.unitNumber}: {unit.title}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {format(new Date(unit.startDate), 'MMM d')} •{' '}
                        {unit.estimatedWeeks} weeks
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </div>
                </motion.div>
              ))}
            </div>

            {upcomingUnits.length > 3 && (
              <p className="text-sm text-gray-500 text-center mt-3">
                + {upcomingUnits.length - 3} more units
              </p>
            )}
          </div>
        )}

        {/* Mini Timeline Placeholder */}
        <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-700">
              Year Timeline
            </h4>
            <button
              onClick={onManageClick}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View Full Timeline →
            </button>
          </div>

          {/* Simple visual timeline */}
          <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${schedule.percentComplete}%` }}
              transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] }}
              className="absolute h-full bg-gradient-to-r from-blue-500 to-purple-600"
            />
          </div>

          <div className="flex justify-between mt-2 text-xs text-gray-600">
            <span>{format(new Date(schedule.schoolYearStart), 'MMM yyyy')}</span>
            <span>{format(new Date(schedule.schoolYearEnd), 'MMM yyyy')}</span>
          </div>
        </div>
      </div>
    </CollapsibleSection>
  );
};

export default CurriculumSection;
