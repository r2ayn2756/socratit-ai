import React from 'react';
import type { ScheduleWizardState } from '../../../../types/curriculum.types';

interface ReviewAdjustStepProps {
  wizardState: ScheduleWizardState;
  onUpdate: (updates: Partial<ScheduleWizardState>) => void;
  onNext: () => void;
  onBack: () => void;
}

export const ReviewAdjustStep: React.FC<ReviewAdjustStepProps> = () => {
  return <div>Review and adjust component</div>;
};
