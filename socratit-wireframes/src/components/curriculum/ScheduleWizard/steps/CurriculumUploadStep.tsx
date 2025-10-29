import React from 'react';
import type { ScheduleWizardState } from '../../../../types/curriculum.types';

interface CurriculumUploadStepProps {
  wizardState: ScheduleWizardState;
  onUpdate: (updates: Partial<ScheduleWizardState>) => void;
  onNext: () => void;
  onBack: () => void;
}

export const CurriculumUploadStep: React.FC<CurriculumUploadStepProps> = () => {
  return <div>Curriculum upload component</div>;
};
