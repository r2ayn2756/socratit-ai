// ============================================================================
// CURRICULUM SECTION COMPONENT
// Displays curriculum schedule in class dashboard
// ============================================================================

import React from 'react';
import { BookOpen, Calendar, Settings } from 'lucide-react';
import { CollapsibleSection } from './CollapsibleSection';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { EmptyState } from '../common/EmptyState';
import { ProgressBar } from '../curriculum/ProgressBar';
import type { CurriculumUnit, CurriculumSchedule } from '../../types/curriculum.types';

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

        {/* All Units - Single Column Display */}
        {allUnits.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-neutral-700 mb-3">
              All Units
            </h4>
            <div className="space-y-3">
              {allUnits.map((unit) => {
                const isCurrent = currentUnit?.id === unit.id;
                const topicNames = unit.subUnits?.map(su => su.name) ||
                                   unit.topics?.flatMap(t => [t.name, ...(t.subtopics || [])]) || [];

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
                    <div className="flex items-start justify-between mb-3">
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

                    {/* Description */}
                    {unit.description && (
                      <p className="text-sm text-neutral-700 mb-3">
                        {unit.description}
                      </p>
                    )}

                    {/* Topics */}
                    {topicNames.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {topicNames.slice(0, 5).map((topic, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 rounded-md bg-neutral-100 text-neutral-700 text-xs"
                          >
                            {topic}
                          </span>
                        ))}
                        {topicNames.length > 5 && (
                          <span className="px-2 py-1 text-neutral-500 text-xs">
                            +{topicNames.length - 5} more
                          </span>
                        )}
                      </div>
                    )}
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
