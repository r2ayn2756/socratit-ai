// ============================================================================
// REVIEW CLASS STEP
// Final step: Review and create the class
// ============================================================================

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, BookOpen, Calendar, FileText, Sparkles, AlertCircle } from 'lucide-react';
import { Button } from '../../../../components/curriculum/Button';
import { GlassCard } from '../../../../components/curriculum/GlassCard';
import type { ClassCreationState } from '../ClassCreationWizard';
import { format } from 'date-fns';
import { uploadService } from '../../../../services/upload.service';
import { classApiService } from '../../../../services/classApi.service';
import { curriculumApi } from '../../../../services/curriculumApi.service';

interface ReviewClassStepProps {
  wizardState: ClassCreationState;
  onUpdate: (updates: Partial<ClassCreationState>) => void;
  onNext: () => void;
  onBack: () => void;
}

export const ReviewClassStep: React.FC<ReviewClassStepProps> = ({
  wizardState,
  onUpdate,
  onNext,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    setIsCreating(true);
    setError(null);

    try {
      // Step 1: Upload curriculum file if provided
      let curriculumMaterialId: string | undefined;
      if (wizardState.curriculumFile) {
        try {
          const uploadedFile = await uploadService.uploadCurriculumFile(
            wizardState.curriculumFile
          );
          curriculumMaterialId = uploadedFile.id;
        } catch (uploadError: any) {
          throw new Error(`Failed to upload curriculum file: ${uploadError.message}`);
        }
      }

      // Step 2: Create class with optional curriculum schedule
      const classData: any = {
        name: wizardState.className,
        subject: wizardState.subject || '',
        gradeLevel: wizardState.gradeLevel || '',
        academicYear: `${wizardState.schoolYearStart?.getFullYear()}-${wizardState.schoolYearEnd?.getFullYear()}`,
        color: 'blue',
      };

      if (wizardState.description) {
        classData.description = wizardState.description;
      }

      // Add curriculum schedule data if available
      if (curriculumMaterialId && wizardState.schoolYearStart && wizardState.schoolYearEnd) {
        classData.curriculumMaterialId = curriculumMaterialId;
        classData.schoolYearStart = wizardState.schoolYearStart.toISOString();
        classData.schoolYearEnd = wizardState.schoolYearEnd.toISOString();
        classData.meetingPattern = wizardState.meetingPattern;
        classData.generateWithAI = !wizardState.skipCurriculum;
        classData.aiPreferences = wizardState.aiPreferences;
      }

      const newClass = await classApiService.createClass(classData);

      // Step 3: If AI generation was requested and we have a schedule, generate it
      if (newClass.scheduleId && classData.generateWithAI && curriculumMaterialId) {
        try {
          await curriculumApi.schedules.generateScheduleFromAI(
            newClass.scheduleId,
            {
              curriculumMaterialId,
              preferences: {
                targetUnits: wizardState.aiPreferences.targetUnits || 8,
                pacingPreference: wizardState.aiPreferences.pacingPreference || 'standard',
              },
            }
          );
        } catch (aiError) {
          // AI generation failed, but class was created successfully
          console.error('AI generation failed:', aiError);
          // Continue anyway - teacher can generate later
        }
      }

      // Update wizard state with created class ID
      onUpdate({ classId: newClass.id });

      // Navigate to class dashboard
      onNext();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create class. Please try again.';
      setError(errorMessage);
      console.error('Class creation error:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const getMeetingPatternLabel = () => {
    const patterns: Record<string, string> = {
      daily: 'Daily (Monday - Friday)',
      mwf: 'Monday, Wednesday, Friday',
      tth: 'Tuesday, Thursday',
      weekly: 'Weekly',
      custom: 'Custom Schedule',
    };
    return patterns[wizardState.meetingPattern] || wizardState.meetingPattern;
  };

  return (
    <div className="space-y-6">
      {/* Class Details */}
      <GlassCard variant="elevated">
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Class Details</h3>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Class Name</p>
              <p className="font-medium text-gray-900">{wizardState.className}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Subject</p>
                <p className="font-medium text-gray-900">{wizardState.subject}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Grade Level</p>
                <p className="font-medium text-gray-900">{wizardState.gradeLevel}</p>
              </div>
            </div>

            {wizardState.description && (
              <div>
                <p className="text-sm text-gray-600">Description</p>
                <p className="text-gray-700 text-sm">{wizardState.description}</p>
              </div>
            )}
          </div>
        </div>
      </GlassCard>

      {/* School Year */}
      <GlassCard variant="elevated">
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">School Year</h3>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Duration</p>
              <p className="font-medium text-gray-900">
                {wizardState.schoolYearStart &&
                  format(wizardState.schoolYearStart, 'MMMM d, yyyy')}
                {' - '}
                {wizardState.schoolYearEnd &&
                  format(wizardState.schoolYearEnd, 'MMMM d, yyyy')}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Meeting Pattern</p>
              <p className="font-medium text-gray-900">{getMeetingPatternLabel()}</p>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Curriculum Status */}
      <GlassCard variant="elevated">
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              wizardState.curriculumFile ? 'bg-green-100' : 'bg-gray-100'
            }`}>
              {wizardState.curriculumFile ? (
                <Sparkles className="w-5 h-5 text-green-600" />
              ) : (
                <FileText className="w-5 h-5 text-gray-400" />
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Curriculum</h3>
          </div>

          {wizardState.curriculumFile ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-600" />
                <p className="font-medium text-gray-900">
                  AI-Generated Curriculum Schedule
                </p>
              </div>

              <div className="pl-7">
                <p className="text-sm text-gray-600 mb-2">
                  Uploaded: {wizardState.curriculumFile.name}
                </p>
                {wizardState.aiPreferences.targetUnits && (
                  <p className="text-sm text-gray-600">
                    {wizardState.aiPreferences.targetUnits} units •{' '}
                    {wizardState.aiPreferences.pacingPreference} pacing
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div>
              <p className="text-gray-600">
                No curriculum uploaded. You can add curriculum materials later.
              </p>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-900">Error Creating Class</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </motion.div>
      )}

      {/* Create Button */}
      <div className="flex justify-end pt-4">
        <Button
          variant="primary"
          size="lg"
          onClick={handleCreate}
          loading={isCreating}
          icon={!isCreating ? <Check className="w-5 h-5" /> : undefined}
        >
          {isCreating ? 'Creating Class...' : 'Create Class'}
        </Button>
      </div>
    </div>
  );
};

export default ReviewClassStep;
