import React from 'react';
import type { ScheduleWizardState } from '../../../../types/curriculum.types';

interface AIGenerationStepProps {
  wizardState: ScheduleWizardState;
  onUpdate: (updates: Partial<ScheduleWizardState>) => void;
  onNext: () => void;
  onBack: () => void;
}

export const AIGenerationStep: React.FC<AIGenerationStepProps> = () => {
  return <div>AI generation component</div>;
};
