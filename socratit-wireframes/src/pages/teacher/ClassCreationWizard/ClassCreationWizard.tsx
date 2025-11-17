// ============================================================================
// CLASS CREATION WIZARD
// Beautiful modal-based wizard for creating classes with curriculum integration
// ============================================================================

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import { Modal, ModalFooter } from '../../../components/shared/Modal';
import { Button } from '../../../components/curriculum/Button';
import { useLanguage } from '../../../contexts/LanguageContext';

// Step Components
import { ClassDetailsStep } from './steps/ClassDetailsStep';
import { CurriculumUploadStep } from './steps/CurriculumUploadStep';
import { SchoolYearStep } from './steps/SchoolYearStep';
import { AIScheduleStep } from './steps/AIScheduleStep';
import { ReviewClassStep } from './steps/ReviewClassStep';

// ============================================================================
// TYPES
// ============================================================================

export interface ClassCreationState {
  // Step tracking
  currentStep: number;
  completedSteps: Set<number>;

  // Class Details (Step 1)
  className: string;
  subject: string;
  gradeLevel: string;
  description: string;

  // School Year & Schedule (Step 2)
  schoolYearStart: Date | null;
  schoolYearEnd: Date | null;
  meetingPattern: string;

  // Curriculum Upload (Step 2)
  curriculumFiles: File[];
  curriculumMaterialIds?: string[]; // Uploaded file IDs from server
  skipCurriculum: boolean;

  // AI Generation (Step 3)
  scheduleId?: string;
  aiGenerating: boolean;
  aiPreferences: {
    targetUnits?: number;
    pacingPreference?: 'slow' | 'standard' | 'fast';
    focusAreas?: string[];
  };
  generatedUnits?: any[]; // AI-generated unit previews with topics/subtopics

  // Final data
  classId?: string;
}

interface Step {
  id: number;
  title: string;
  subtitle: string;
  component: React.ComponentType<StepProps>;
  canSkip: boolean;
}

interface StepProps {
  wizardState: ClassCreationState;
  onUpdate: (updates: Partial<ClassCreationState>) => void;
  onNext: () => void;
  onBack: () => void;
  onComplete?: (classId: string) => void;
}

// ============================================================================
// WIZARD CONFIGURATION
// ============================================================================

// Note: STEPS array is now created inside component to use t() function

// ============================================================================
// MAIN WIZARD COMPONENT
// ============================================================================

interface ClassCreationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (classId: string) => void;
}

export const ClassCreationWizard: React.FC<ClassCreationWizardProps> = ({
  isOpen,
  onClose,
  onComplete,
}) => {
  const { t } = useLanguage();

  const STEPS: Step[] = [
    {
      id: 1,
      title: t('classWizard.step1.title'),
      subtitle: t('classWizard.step1.subtitle'),
      component: ClassDetailsStep,
      canSkip: false,
    },
    {
      id: 2,
      title: t('classWizard.step2.title'),
      subtitle: t('classWizard.step2.subtitle'),
      component: SchoolYearStep,
      canSkip: false,
    },
    {
      id: 3,
      title: t('classWizard.step3.title'),
      subtitle: t('classWizard.step3.subtitle'),
      component: CurriculumUploadStep,
      canSkip: true,
    },
    {
      id: 4,
      title: t('classWizard.step4.title') || 'AI Schedule',
      subtitle: t('classWizard.step4.subtitle') || 'Generate curriculum with AI',
      component: AIScheduleStep,
      canSkip: true, // Can skip if no curriculum uploaded
    },
    {
      id: 5,
      title: t('classWizard.step5.title') || 'Review',
      subtitle: t('classWizard.step5.subtitle') || 'Review and create class',
      component: ReviewClassStep,
      canSkip: false,
    },
  ];

  const [wizardState, setWizardState] = useState<ClassCreationState>({
    currentStep: 1,
    completedSteps: new Set(),
    className: '',
    subject: '',
    gradeLevel: '',
    description: '',
    schoolYearStart: new Date(new Date().getFullYear(), 7, 1), // Default to August 1st of current year
    schoolYearEnd: new Date(new Date().getFullYear() + 1, 5, 30), // Default to June 30th of next year
    meetingPattern: 'daily',
    curriculumFiles: [],
    skipCurriculum: false,
    aiGenerating: false,
    aiPreferences: {},
  });

  const currentStepConfig = STEPS[wizardState.currentStep - 1];
  const CurrentStepComponent = currentStepConfig.component;

  const handleUpdate = (updates: Partial<ClassCreationState>) => {
    setWizardState(prev => ({ ...prev, ...updates }));
  };

  const handleNext = () => {
    // Mark current step as completed
    const newCompletedSteps = new Set(wizardState.completedSteps);
    newCompletedSteps.add(wizardState.currentStep);

    // Determine next step
    let nextStep = wizardState.currentStep + 1;

    // Skip AI Schedule step (step 4) if curriculum was skipped
    if (nextStep === 4 && wizardState.skipCurriculum) {
      nextStep = 5; // Jump directly to Review step
      console.log('[Wizard] Skipping AI Schedule step - no curriculum uploaded');
    }

    setWizardState(prev => ({
      ...prev,
      currentStep: nextStep,
      completedSteps: newCompletedSteps,
    }));
  };

  const handleBack = () => {
    let previousStep = wizardState.currentStep - 1;

    // Skip AI Schedule step (step 4) if going back and curriculum was skipped
    if (previousStep === 4 && wizardState.skipCurriculum) {
      previousStep = 3; // Go back to Curriculum Upload step
      console.log('[Wizard] Skipping AI Schedule step (going back) - no curriculum uploaded');
    }

    setWizardState(prev => ({
      ...prev,
      currentStep: Math.max(1, previousStep),
    }));
  };

  const handleStepClick = (stepId: number) => {
    // Only allow clicking on completed steps or current step
    if (wizardState.completedSteps.has(stepId) || stepId === wizardState.currentStep) {
      setWizardState(prev => ({
        ...prev,
        currentStep: stepId,
      }));
    }
  };

  const handleCancel = () => {
    // Reset state
    setWizardState({
      currentStep: 1,
      completedSteps: new Set(),
      className: '',
      subject: '',
      gradeLevel: '',
      description: '',
      schoolYearStart: new Date(new Date().getFullYear(), 7, 1),
      schoolYearEnd: new Date(new Date().getFullYear() + 1, 5, 30),
      meetingPattern: 'daily',
      curriculumFiles: [],
      skipCurriculum: false,
      aiGenerating: false,
      aiPreferences: {},
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      size="xl"
      showCloseButton={false}
      closeOnEscape={false}
      closeOnOverlayClick={false}
    >
      <div className="flex flex-col h-full max-h-[calc(90vh-4rem)]">
        {/* Progress Steps - Fixed at top */}
        <div className="flex-shrink-0 pb-6">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const isCompleted = wizardState.completedSteps.has(step.id);
              const isCurrent = wizardState.currentStep === step.id;
              const isClickable = isCompleted || isCurrent;

              return (
                <React.Fragment key={step.id}>
                  {/* Step Circle */}
                  <div className="flex flex-col items-center flex-1">
                    <button
                      onClick={() => isClickable && handleStepClick(step.id)}
                      disabled={!isClickable}
                      className={`
                        w-12 h-12 rounded-full flex items-center justify-center
                        transition-all duration-300 mb-2
                        ${isCompleted
                          ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/30'
                          : isCurrent
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 scale-110'
                            : 'bg-gray-100 text-gray-400'
                        }
                        ${isClickable ? 'cursor-pointer hover:scale-105' : 'cursor-default'}
                      `}
                    >
                      {isCompleted ? (
                        <Check className="w-6 h-6" />
                      ) : (
                        <span className="text-lg font-semibold">{step.id}</span>
                      )}
                    </button>

                    <p className={`
                      text-xs font-medium text-center
                      ${isCurrent ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'}
                    `}>
                      {step.title}
                    </p>
                  </div>

                  {/* Connector Line */}
                  {index < STEPS.length - 1 && (
                    <div className={`
                      h-0.5 flex-1 mx-2 transition-colors duration-300
                      ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}
                    `} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Step Title - Fixed at top */}
        <div className="flex-shrink-0 text-center pb-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {currentStepConfig.title}
          </h3>
          <p className="text-gray-600">
            {currentStepConfig.subtitle}
          </p>
        </div>

        {/* Step Content - Scrollable area */}
        <div className="flex-1 overflow-y-auto modal-scroll pb-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={wizardState.currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            >
              <CurrentStepComponent
                wizardState={wizardState}
                onUpdate={handleUpdate}
                onNext={handleNext}
                onBack={handleBack}
                onComplete={onComplete}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer Navigation - Fixed at bottom */}
        <div className="flex-shrink-0 flex items-center justify-between pt-6 border-t border-gray-200">
          <Button
            variant="ghost"
            onClick={wizardState.currentStep === 1 ? handleCancel : handleBack}
          >
            {wizardState.currentStep === 1 ? t('common.buttons.cancel') : t('common.buttons.back')}
          </Button>

          <div className="flex items-center gap-3">
            {currentStepConfig.canSkip && (
              <Button
                variant="ghost"
                onClick={handleNext}
              >
                {t('classWizard.curriculum.skipCurriculum')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ClassCreationWizard;
