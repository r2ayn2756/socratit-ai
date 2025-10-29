// ============================================================================
// SCHEDULE WIZARD COMPONENT
// Multi-step wizard for creating curriculum schedules
// ============================================================================

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { GlassCard, GlassPanel } from '../GlassCard';
import { Button, ButtonGroup } from '../Button';
import type { ScheduleWizardState } from '../../../types/curriculum.types';

// Import wizard steps (will create these next)
import { ClassSelectionStep } from './steps/ClassSelectionStep';
import { SchoolYearStep } from './steps/SchoolYearStep';
import { CurriculumUploadStep } from './steps/CurriculumUploadStep';
import { AIGenerationStep } from './steps/AIGenerationStep';
import { ReviewAdjustStep } from './steps/ReviewAdjustStep';
import { PublishStep } from './steps/PublishStep';

interface ScheduleWizardProps {
  onComplete: (scheduleId: string) => void;
  onCancel: () => void;
}

const WIZARD_STEPS = [
  {
    id: 1,
    title: 'Select Class',
    description: 'Choose the class for this curriculum',
    component: ClassSelectionStep,
  },
  {
    id: 2,
    title: 'School Year',
    description: 'Set the school year dates',
    component: SchoolYearStep,
  },
  {
    id: 3,
    title: 'Curriculum',
    description: 'Upload curriculum materials',
    component: CurriculumUploadStep,
  },
  {
    id: 4,
    title: 'AI Generation',
    description: 'Generate schedule with AI',
    component: AIGenerationStep,
  },
  {
    id: 5,
    title: 'Review & Adjust',
    description: 'Fine-tune your schedule',
    component: ReviewAdjustStep,
  },
  {
    id: 6,
    title: 'Publish',
    description: 'Publish to students',
    component: PublishStep,
  },
];

export const ScheduleWizard: React.FC<ScheduleWizardProps> = ({
  onComplete,
  onCancel,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [wizardState, setWizardState] = useState<ScheduleWizardState>({
    currentStep: 0,
    title: '',
    description: '',
    aiGenerated: false,
    units: [],
  });

  const CurrentStepComponent = WIZARD_STEPS[currentStep].component;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === WIZARD_STEPS.length - 1;

  const handleNext = () => {
    if (!isLastStep) {
      setCurrentStep(currentStep + 1);
      setWizardState({ ...wizardState, currentStep: currentStep + 1 });
    }
  };

  const handleBack = () => {
    if (!isFirstStep) {
      setCurrentStep(currentStep - 1);
      setWizardState({ ...wizardState, currentStep: currentStep - 1 });
    }
  };

  const handleStepClick = (stepIndex: number) => {
    // Only allow clicking completed steps or current step
    if (stepIndex <= currentStep) {
      setCurrentStep(stepIndex);
      setWizardState({ ...wizardState, currentStep: stepIndex });
    }
  };

  const handleStateUpdate = (updates: Partial<ScheduleWizardState>) => {
    setWizardState({ ...wizardState, ...updates });
  };

  const handleFinish = async () => {
    if (wizardState.scheduleId) {
      onComplete(wizardState.scheduleId);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Create Curriculum Schedule
          </h1>
          <p className="text-gray-600">
            Build your year-long curriculum plan with AI assistance
          </p>
        </div>

        {/* Progress Steps */}
        <GlassCard padding="lg" className="mb-8">
          <div className="flex items-center justify-between">
            {WIZARD_STEPS.map((step, index) => (
              <React.Fragment key={step.id}>
                {/* Step Circle */}
                <div className="flex flex-col items-center relative">
                  <button
                    onClick={() => handleStepClick(index)}
                    disabled={index > currentStep}
                    className={`
                      w-12 h-12 rounded-full flex items-center justify-center
                      font-semibold transition-all duration-300
                      ${
                        index < currentStep
                          ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                          : index === currentStep
                          ? 'bg-blue-500 text-white shadow-xl shadow-blue-500/40 scale-110'
                          : 'bg-gray-200 text-gray-400'
                      }
                      ${index <= currentStep ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed'}
                    `}
                  >
                    {index < currentStep ? (
                      <Check className="w-6 h-6" />
                    ) : (
                      step.id
                    )}
                  </button>
                  <div className="mt-2 text-center">
                    <p className={`
                      text-sm font-medium
                      ${index === currentStep ? 'text-blue-600' : 'text-gray-600'}
                    `}>
                      {step.title}
                    </p>
                    <p className="text-xs text-gray-500">{step.description}</p>
                  </div>
                </div>

                {/* Connector Line */}
                {index < WIZARD_STEPS.length - 1 && (
                  <div className="flex-1 mx-4 mb-12">
                    <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: index < currentStep ? '100%' : '0%',
                        }}
                        transition={{ duration: 0.3 }}
                        className="h-full bg-gradient-to-r from-green-500 to-blue-500"
                      />
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </GlassCard>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <GlassPanel
              title={WIZARD_STEPS[currentStep].title}
              subtitle={WIZARD_STEPS[currentStep].description}
            >
              <CurrentStepComponent
                wizardState={wizardState}
                onUpdate={handleStateUpdate}
                onNext={handleNext}
                onBack={handleBack}
              />
            </GlassPanel>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="mt-8 flex items-center justify-between">
          <Button
            variant="ghost"
            size="lg"
            onClick={onCancel}
            icon={<ChevronLeft className="w-5 h-5" />}
          >
            Cancel
          </Button>

          <ButtonGroup>
            {!isFirstStep && (
              <Button
                variant="secondary"
                size="lg"
                onClick={handleBack}
                icon={<ChevronLeft className="w-5 h-5" />}
              >
                Back
              </Button>
            )}

            {!isLastStep ? (
              <Button
                variant="primary"
                size="lg"
                onClick={handleNext}
                icon={<ChevronRight className="w-5 h-5" />}
                iconPosition="right"
              >
                Next
              </Button>
            ) : (
              <Button
                variant="primary"
                size="lg"
                onClick={handleFinish}
                icon={<Check className="w-5 h-5" />}
                iconPosition="right"
              >
                Finish & Publish
              </Button>
            )}
          </ButtonGroup>
        </div>
      </div>
    </div>
  );
};

export default ScheduleWizard;
