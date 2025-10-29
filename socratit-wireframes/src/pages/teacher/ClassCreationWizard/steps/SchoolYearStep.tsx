// ============================================================================
// SCHOOL YEAR STEP
// Second step: Set school year dates and meeting pattern
// ============================================================================

import React from 'react';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { DateRangePicker } from '../../../../components/shared/DatePicker';
import { Button } from '../../../../components/curriculum/Button';
import type { ClassCreationState } from '../ClassCreationWizard';
import { differenceInWeeks, differenceInDays, format } from 'date-fns';

interface SchoolYearStepProps {
  wizardState: ClassCreationState;
  onUpdate: (updates: Partial<ClassCreationState>) => void;
  onNext: () => void;
  onBack: () => void;
}

const MEETING_PATTERNS = [
  {
    id: 'daily',
    label: 'Daily',
    description: 'Monday through Friday',
    daysPerWeek: 5,
  },
  {
    id: 'mwf',
    label: 'Monday, Wednesday, Friday',
    description: '3 days per week',
    daysPerWeek: 3,
  },
  {
    id: 'tth',
    label: 'Tuesday, Thursday',
    description: '2 days per week',
    daysPerWeek: 2,
  },
  {
    id: 'weekly',
    label: 'Weekly',
    description: '1 day per week',
    daysPerWeek: 1,
  },
  {
    id: 'custom',
    label: 'Custom',
    description: 'Set your own schedule',
    daysPerWeek: 5,
  },
];

export const SchoolYearStep: React.FC<SchoolYearStepProps> = ({
  wizardState,
  onUpdate,
  onNext,
}) => {
  const isValid =
    wizardState.schoolYearStart !== null &&
    wizardState.schoolYearEnd !== null &&
    wizardState.meetingPattern.length > 0;

  const calculateDuration = () => {
    if (!wizardState.schoolYearStart || !wizardState.schoolYearEnd) {
      return null;
    }

    const weeks = differenceInWeeks(
      wizardState.schoolYearEnd,
      wizardState.schoolYearStart
    );
    const days = differenceInDays(
      wizardState.schoolYearEnd,
      wizardState.schoolYearStart
    );

    const pattern = MEETING_PATTERNS.find(p => p.id === wizardState.meetingPattern);
    const instructionalDays = pattern
      ? Math.floor((days / 7) * pattern.daysPerWeek)
      : days;

    return { weeks, days, instructionalDays };
  };

  const duration = calculateDuration();

  const handleNext = () => {
    if (isValid) {
      onNext();
    }
  };

  return (
    <div className="space-y-8">
      {/* Date Range Picker */}
      <div>
        <DateRangePicker
          label="School Year Dates"
          startDate={wizardState.schoolYearStart}
          endDate={wizardState.schoolYearEnd}
          onStartDateChange={(date) => onUpdate({ schoolYearStart: date })}
          onEndDateChange={(date) => onUpdate({ schoolYearEnd: date })}
          startPlaceholder="Start date"
          endPlaceholder="End date"
          helperText="Select the first and last day of your school year"
          required
        />
      </div>

      {/* Meeting Pattern */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Meeting Pattern <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-4">
          {MEETING_PATTERNS.map((pattern) => (
            <motion.button
              key={pattern.id}
              type="button"
              onClick={() => onUpdate({ meetingPattern: pattern.id })}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`
                p-4 rounded-xl text-left
                transition-all duration-200
                ${wizardState.meetingPattern === pattern.id
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-white/70 backdrop-blur-xl border border-gray-200 hover:border-blue-300'
                }
              `}
            >
              <div className="flex items-start gap-3">
                <div className={`
                  w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
                  ${wizardState.meetingPattern === pattern.id
                    ? 'bg-white/20'
                    : 'bg-blue-50'
                  }
                `}>
                  <Clock className={`w-5 h-5 ${
                    wizardState.meetingPattern === pattern.id
                      ? 'text-white'
                      : 'text-blue-600'
                  }`} />
                </div>
                <div className="flex-1">
                  <h4 className={`font-semibold mb-1 ${
                    wizardState.meetingPattern === pattern.id
                      ? 'text-white'
                      : 'text-gray-900'
                  }`}>
                    {pattern.label}
                  </h4>
                  <p className={`text-sm ${
                    wizardState.meetingPattern === pattern.id
                      ? 'text-white/80'
                      : 'text-gray-600'
                  }`}>
                    {pattern.description}
                  </p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Duration Preview */}
      {duration && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/80 flex items-center justify-center flex-shrink-0">
              <CalendarIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-2">
                School Year Overview
              </h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 mb-1">Duration</p>
                  <p className="font-semibold text-gray-900">
                    {duration.weeks} weeks
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Calendar Days</p>
                  <p className="font-semibold text-gray-900">
                    {duration.days} days
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Instructional Days</p>
                  <p className="font-semibold text-gray-900">
                    ~{duration.instructionalDays} days
                  </p>
                </div>
              </div>
              {wizardState.schoolYearStart && wizardState.schoolYearEnd && (
                <p className="mt-3 text-xs text-gray-600">
                  {format(wizardState.schoolYearStart, 'MMMM d, yyyy')}
                  {' → '}
                  {format(wizardState.schoolYearEnd, 'MMMM d, yyyy')}
                </p>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Next Button */}
      <div className="flex justify-end pt-4">
        <Button
          variant="primary"
          size="lg"
          onClick={handleNext}
          disabled={!isValid}
        >
          Continue
        </Button>
      </div>
    </div>
  );
};

export default SchoolYearStep;
