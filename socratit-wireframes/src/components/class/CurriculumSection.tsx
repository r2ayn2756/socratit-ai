// ============================================================================
// CURRICULUM SECTION COMPONENT
// Displays curriculum schedule in class dashboard
// ============================================================================

import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Calendar, ArrowRight, Settings } from 'lucide-react';
import { CollapsibleSection } from './CollapsibleSection';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { EmptyState } from '../common/EmptyState';
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
        <EmptyState
          icon={BookOpen}
          title="No Curriculum Schedule"
          message="No curriculum schedule has been created for this class yet. Create one to organize your year-long teaching plan."
          action={{
            label: 'Create Curriculum Schedule',
            onClick: onManageClick || (() => {}),
            icon: Calendar,
          }}
        />
      </CollapsibleSection>
    );
  }

  const allUnits = schedule.units || [];

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
          icon={<Settings />}
        >
          Manage Full Schedule
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Overall Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-neutral-700">Overall Progress</span>
            <span className="text-sm font-semibold text-primary-600">
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

        {/* Condensed Unit List - All Units At a Glance */}
        {allUnits.length > 0 && (
          <div className="p-4 rounded-xl bg-gradient-to-br from-neutral-50 to-neutral-100/50 border border-neutral-200">
            <h4 className="text-sm font-semibold text-neutral-700 mb-3">
              Units Overview ({allUnits.length} total)
            </h4>
            <div className="flex flex-wrap gap-2">
              {allUnits.map((unit) => {
                const isCurrent = currentUnit?.id === unit.id;
                return (
                  <motion.button
                    key={unit.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onUnitClick?.(unit)}
                    className={`
                      px-3 py-2 rounded-lg text-sm font-medium transition-all
                      ${
                        isCurrent
                          ? 'bg-primary-500 text-white shadow-md'
                          : 'bg-white/80 text-neutral-700 hover:bg-white hover:shadow-sm border border-neutral-200'
                      }
                    `}
                  >
                    Unit {unit.unitNumber}
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}

        {/* All Units - Single Column Display */}
        {allUnits.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-neutral-700 mb-3">
              All Units
            </h4>
            <div className="space-y-3">
              {allUnits.map((unit) => {
                const isCurrent = currentUnit?.id === unit.id;
                const subUnitCount = unit.subUnits?.length || unit.topics?.length || 0;

                return (
                  <Card
                    key={unit.id}
                    hover
                    padding="md"
                    onClick={() => onUnitClick?.(unit)}
                    className={`
                      ${isCurrent ? 'border-2 border-primary-300 bg-gradient-to-br from-primary-50 to-secondary-50' : ''}
                    `}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {isCurrent && (
                          <div className="px-2 py-1 rounded-md bg-primary-500 text-white text-xs font-semibold">
                            CURRENT
                          </div>
                        )}
                        <h4 className="font-semibold text-neutral-900">
                          Unit {unit.unitNumber}: {unit.title}
                        </h4>
                      </div>
                    </div>

                    <p className="text-sm text-neutral-600 mb-3 line-clamp-1">
                      {subUnitCount} topics to cover
                    </p>

                    <div className="flex items-center gap-4 text-sm text-neutral-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {format(new Date(unit.startDate), 'MMM d')} -{' '}
                          {format(new Date(unit.endDate), 'MMM d')}
                        </span>
                      </div>
                      <div className="px-2 py-1 rounded-md bg-neutral-100 text-neutral-700 font-medium">
                        {unit.estimatedWeeks} weeks
                      </div>
                      {unit.percentComplete !== undefined && (
                        <div className="text-primary-600 font-semibold ml-auto">
                          {unit.percentComplete}% complete
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </CollapsibleSection>
  );
};

export default CurriculumSection;
