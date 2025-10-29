import React from 'react';
import type { ScheduleWizardState } from '../../../../types/curriculum.types';

interface PublishStepProps {
  wizardState: ScheduleWizardState;
  onUpdate: (updates: Partial<ScheduleWizardState>) => void;
  onNext: () => void;
  onBack: () => void;
}

export const PublishStep: React.FC<PublishStepProps> = () => {
  return <div>Publish component</div>;
};
