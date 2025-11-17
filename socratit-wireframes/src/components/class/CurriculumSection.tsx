// ============================================================================
// CURRICULUM SECTION COMPONENT
// Displays curriculum schedule in class dashboard
// ============================================================================

import React from 'react';
import { BookOpen, Calendar, Settings, Sparkles } from 'lucide-react';
import { CollapsibleSection } from './CollapsibleSection';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { EmptyState } from '../common/EmptyState';
import { ProgressBar } from '../curriculum/ProgressBar';
import type { CurriculumUnit, CurriculumSchedule, CurriculumSubUnit } from '../../types/curriculum.types';

interface CurriculumSectionProps {
  schedule: CurriculumSchedule | null;
  currentUnit?: CurriculumUnit;
  upcomingUnits?: CurriculumUnit[];
  onManageClick?: () => void;
  onUnitClick?: (unit: CurriculumUnit) => void;
  onGenerateAssignment?: (subUnit: CurriculumSubUnit) => void;
}

export const CurriculumSection: React.FC<CurriculumSectionProps> = ({
  schedule,
  currentUnit,
  upcomingUnits = [],
  onManageClick,
  onUnitClick,
  onGenerateAssignment,
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

                // Get sub-units from either the subUnits array or convert topics to pseudo-subunits
                // Check if subUnits has actual content, not just an empty array
                const subUnits = (unit.subUnits && unit.subUnits.length > 0)
                  ? unit.subUnits
                  : unit.topics?.map((topic, idx) => ({
                  id: `topic-${unit.id}-${idx}`,
                  unitId: unit.id,
                  name: topic.name,
                  orderIndex: idx,
                  concepts: topic.concepts || [],
                    learningObjectives: topic.learningObjectives || [],
                    estimatedHours: 0,
                    aiGenerated: unit.aiGenerated,
                    teacherModified: unit.teacherModified,
                    createdAt: unit.createdAt,
                    updatedAt: unit.updatedAt,
                  })) || [];

                return (
                  <Card
                    key={unit.id}
                    padding="md"
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

                    {/* Sub-units as clickable items */}
                    {subUnits.length > 0 && (
                      <div className="space-y-2">
                        {subUnits.map((subUnit, idx) => (
                          <div
                            key={subUnit.id}
                            className="group p-3 rounded-lg bg-white border border-neutral-200 hover:border-primary-300 hover:shadow-sm transition-all cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onGenerateAssignment) {
                                onGenerateAssignment(subUnit);
                              }
                            }}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3 flex-1">
                                <span className="px-2 py-1 rounded-md bg-primary-100 text-primary-700 text-xs font-semibold flex-shrink-0">
                                  {idx + 1}
                                </span>
                                <span className="text-sm font-medium text-neutral-900">
                                  {subUnit.name}
                                </span>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onGenerateAssignment) {
                                    onGenerateAssignment(subUnit);
                                  }
                                }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1.5 rounded-md bg-gradient-to-r from-primary-500 to-secondary-600 text-white text-xs font-medium hover:shadow-md flex items-center gap-1.5"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                                Generate Assignment
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* No sub-units state */}
                    {subUnits.length === 0 && (
                      <div className="text-sm text-neutral-500 italic">
                        No topics available for this unit
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
