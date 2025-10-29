// ============================================================================
// SCHOOL YEAR STEP
// Second step: Set school year dates
// ============================================================================

import React from 'react';
import type { ScheduleWizardState } from '../../../../types/curriculum.types';

interface SchoolYearStepProps {
  wizardState: ScheduleWizardState;
  onUpdate: (updates: Partial<ScheduleWizardState>) => void;
  onNext: () => void;
  onBack: () => void;
}

export const SchoolYearStep: React.FC<SchoolYearStepProps> = ({
  wizardState,
  onUpdate,
}) => {
  return (
    <div className="space-y-6">
      <p className="text-gray-600">School year date selection component</p>
      {/* Implementation pending */}
    </div>
  );
};
