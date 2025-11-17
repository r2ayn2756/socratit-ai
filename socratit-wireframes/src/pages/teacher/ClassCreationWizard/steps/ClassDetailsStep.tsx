// ============================================================================
// CLASS DETAILS STEP
// First step: Capture basic class information
// ============================================================================

import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, GraduationCap, FileText } from 'lucide-react';
import { Button } from '../../../../components/curriculum/Button';
import { useLanguage } from '../../../../contexts/LanguageContext';
import type { ClassCreationState } from '../ClassCreationWizard';

interface ClassDetailsStepProps {
  wizardState: ClassCreationState;
  onUpdate: (updates: Partial<ClassCreationState>) => void;
  onNext: () => void;
  onBack: () => void;
}

const SUBJECTS = [
  'Mathematics',
  'English Language Arts',
  'Science',
  'Social Studies',
  'Foreign Language',
  'Physical Education',
  'Arts',
  'Music',
  'Technology',
  'Other',
];

const GRADE_LEVELS = [
  'Kindergarten',
  '1st Grade',
  '2nd Grade',
  '3rd Grade',
  '4th Grade',
  '5th Grade',
  '6th Grade',
  '7th Grade',
  '8th Grade',
  '9th Grade',
  '10th Grade',
  '11th Grade',
  '12th Grade',
];

export const ClassDetailsStep: React.FC<ClassDetailsStepProps> = ({
  wizardState,
  onUpdate,
  onNext,
}) => {
  const { t } = useLanguage();

  const isValid =
    wizardState.className.trim().length > 0 &&
    wizardState.subject.length > 0 &&
    wizardState.gradeLevel.length > 0;

  const handleNext = () => {
    if (isValid) {
      onNext();
    }
  };

  return (
    <div className="space-y-6">
      {/* Next Button - Top */}
      <div className="flex justify-end pb-2 pr-2">
        <Button
          variant="primary"
          size="lg"
          onClick={handleNext}
          disabled={!isValid}
        >
          {t('common.buttons.continue')}
        </Button>
      </div>

      {/* Class Name and Grade Level - Side by Side */}
      <div className="grid grid-cols-2 gap-4">
        {/* Class Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('classWizard.details.className')} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={wizardState.className}
              onChange={(e) => onUpdate({ className: e.target.value })}
              placeholder={t('classWizard.details.classNamePlaceholder')}
              className="
                w-full pl-12 pr-4 py-3 rounded-xl
                bg-white/70 backdrop-blur-xl border border-gray-200
                text-gray-900 placeholder-gray-400
                focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500
                transition-all duration-200
              "
            />
          </div>
        </div>

        {/* Grade Level */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('classWizard.details.gradeLevel')} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <GraduationCap className="w-5 h-5" />
            </div>
            <select
              value={wizardState.gradeLevel}
              onChange={(e) => onUpdate({ gradeLevel: e.target.value })}
              className="
                w-full pl-12 pr-4 py-3 rounded-xl
                bg-white/70 backdrop-blur-xl border border-gray-200
                text-gray-900
                focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500
                transition-all duration-200
                appearance-none cursor-pointer
              "
            >
              <option value="">{t('classWizard.details.gradeLevelPlaceholder')}</option>
              {GRADE_LEVELS.map((grade) => (
                <option key={grade} value={grade}>
                  {grade}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Subject */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('classWizard.details.subject')} <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          {SUBJECTS.map((subject) => (
            <motion.button
              key={subject}
              type="button"
              onClick={() => onUpdate({ subject })}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`
                px-4 py-3 rounded-xl text-sm font-medium
                transition-all duration-200
                ${wizardState.subject === subject
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-white/70 backdrop-blur-xl border border-gray-200 text-gray-700 hover:border-blue-300'
                }
              `}
            >
              {subject}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Description (Optional) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('classWizard.details.description')} <span className="text-gray-400 text-xs">(Optional)</span>
        </label>
        <div className="relative">
          <div className="absolute left-4 top-4 text-gray-400">
            <FileText className="w-5 h-5" />
          </div>
          <textarea
            value={wizardState.description}
            onChange={(e) => onUpdate({ description: e.target.value })}
            placeholder={t('classWizard.details.descriptionPlaceholder')}
            rows={4}
            className="
              w-full pl-12 pr-4 py-3 rounded-xl
              bg-white/70 backdrop-blur-xl border border-gray-200
              text-gray-900 placeholder-gray-400
              focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500
              transition-all duration-200
              resize-none
            "
          />
        </div>
      </div>

    </div>
  );
};

export default ClassDetailsStep;
