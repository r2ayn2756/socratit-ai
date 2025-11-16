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
import { classCurriculumService } from '../../../../services/classCurriculum.service';
import { curriculumApi } from '../../../../services/curriculumApi.service';

interface ReviewClassStepProps {
  wizardState: ClassCreationState;
  onUpdate: (updates: Partial<ClassCreationState>) => void;
  onNext: () => void;
  onBack: () => void;
  onComplete?: (classId: string) => void;
}

export const ReviewClassStep: React.FC<ReviewClassStepProps> = ({
  wizardState,
  onUpdate,
  onNext,
  onComplete,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    setIsCreating(true);
    setError(null);

    try {
      console.log('Starting class creation flow...');
      console.log('[DEBUG] Full wizard state:', wizardState);

      // Step 1: Get curriculum file IDs (already uploaded in AI step if applicable)
      let curriculumMaterialIds: string[] = [];
      if (wizardState.curriculumMaterialIds && wizardState.curriculumMaterialIds.length > 0) {
        // Files were already uploaded during AI processing
        curriculumMaterialIds = wizardState.curriculumMaterialIds;
        console.log('Using pre-uploaded curriculum files:', curriculumMaterialIds);
      } else if (wizardState.curriculumFiles.length > 0) {
        // Fallback: Upload files if they weren't uploaded yet (shouldn't happen normally)
        console.log('Uploading curriculum files:', wizardState.curriculumFiles.map(f => f.name).join(', '));
        setLoadingMessage(`Uploading ${wizardState.curriculumFiles.length} file(s)...`);
        try {
          for (const file of wizardState.curriculumFiles) {
            const uploadedFile = await uploadService.uploadCurriculumFile(file);
            curriculumMaterialIds.push(uploadedFile.id);
            console.log('Curriculum file uploaded successfully:', uploadedFile.id);
          }
          setLoadingMessage('Creating class...');
        } catch (uploadError: any) {
          console.error('Upload error:', uploadError);
          throw new Error(`Failed to upload curriculum files: ${uploadError.message}`);
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
      console.log('[DEBUG] Curriculum condition check:', {
        hasCurriculumMaterialIds: curriculumMaterialIds.length > 0,
        hasSchoolYearStart: !!wizardState.schoolYearStart,
        hasSchoolYearEnd: !!wizardState.schoolYearEnd,
        curriculumMaterialIds,
        schoolYearStart: wizardState.schoolYearStart,
        schoolYearEnd: wizardState.schoolYearEnd,
        skipCurriculum: wizardState.skipCurriculum,
      });

      if (curriculumMaterialIds.length > 0 && wizardState.schoolYearStart && wizardState.schoolYearEnd) {
        console.log('[DEBUG] Adding curriculum fields to classData');
        try {
          // Use the first file as primary curriculum material for now
          // In the future, the backend could support multiple files
          classData.curriculumMaterialId = curriculumMaterialIds[0];
          classData.curriculumMaterialIds = curriculumMaterialIds; // Pass all IDs for future use
          classData.schoolYearStart = wizardState.schoolYearStart.toISOString();
          classData.schoolYearEnd = wizardState.schoolYearEnd.toISOString();
          classData.meetingPattern = wizardState.meetingPattern;
          classData.generateWithAI = !wizardState.skipCurriculum;
          classData.aiPreferences = wizardState.aiPreferences;
          console.log('[DEBUG] Curriculum fields added successfully');
        } catch (dateError) {
          console.error('[ERROR] Failed to convert dates to ISO string:', dateError);
          console.error('[ERROR] schoolYearStart type:', typeof wizardState.schoolYearStart);
          console.error('[ERROR] schoolYearEnd type:', typeof wizardState.schoolYearEnd);
          throw new Error('Invalid date format. Please refresh and try again.');
        }
      } else {
        console.log('[DEBUG] Skipping curriculum fields - condition not met');
      }

      console.log('Creating class with data:', classData);
      console.log('[DEBUG] classData.curriculumMaterialId:', classData.curriculumMaterialId);
      console.log('[DEBUG] classData.schoolYearStart:', classData.schoolYearStart);
      console.log('[DEBUG] classData.schoolYearEnd:', classData.schoolYearEnd);
      console.log('[DEBUG] classData.generateWithAI:', classData.generateWithAI);
      console.log('[DEBUG] Calling API: POST /api/v1/classes');
      const newClass = await classCurriculumService.createClass(classData);
      console.log('Class created successfully:', newClass);
      console.log('[DEBUG] Response includes scheduleId:', newClass.scheduleId);

      // Step 3: If AI generation was requested and we have a schedule, generate it
      let aiGenerationFailed = false;
      if (newClass.scheduleId && classData.generateWithAI && curriculumMaterialIds.length > 0) {
        console.log('Starting AI schedule generation for schedule:', newClass.scheduleId);
        setLoadingMessage('Analyzing curriculum and generating units with AI... This may take up to 2 minutes.');

        try {
          // Use the first curriculum material for AI generation
          // In the future, AI could potentially analyze multiple files
          const aiResult = await curriculumApi.schedules.generateScheduleFromAI(
            newClass.scheduleId,
            {
              curriculumMaterialId: curriculumMaterialIds[0],
              preferences: {
                targetUnits: wizardState.aiPreferences.targetUnits || 8,
                pacingPreference: (wizardState.aiPreferences.pacingPreference || 'standard') as 'standard' | 'accelerated' | 'extended',
              },
            }
          );
          console.log('AI generation completed:', aiResult);
        } catch (aiError: any) {
          // AI generation failed, but class was created successfully
          console.error('AI generation failed:', aiError);
          aiGenerationFailed = true;
          const aiErrorMessage = aiError.response?.data?.message || aiError.message;

          // Provide more helpful error message for timeout
          if (aiErrorMessage.includes('timeout')) {
            setError(`Class created successfully, but AI generation timed out. This usually happens with large curriculum files. You can generate the curriculum later from the class dashboard (it will work there). Click "Continue" to proceed to your class.`);
          } else {
            setError(`Class created successfully, but AI generation failed: ${aiErrorMessage || 'Unknown error'}. You can generate the curriculum later from the class dashboard. Click "Continue" to proceed to your class.`);
          }
          // Don't throw - teacher can generate later
        } finally {
          setLoadingMessage('');
        }
      }

      // Update wizard state with created class ID
      onUpdate({ classId: newClass.id });

      // Complete wizard and navigate to class dashboard (even if AI failed)
      if (!aiGenerationFailed && onComplete) {
        console.log('Navigating to class dashboard:', newClass.id);
        onComplete(newClass.id);
      }
      // If AI failed, don't auto-navigate - let teacher see the error and manually continue
    } catch (err: any) {
      console.error('[ERROR] Class creation failed:', err);
      console.error('[ERROR] Error response:', err.response);
      console.error('[ERROR] Error message:', err.message);
      console.error('[ERROR] Full error object:', JSON.stringify(err, Object.getOwnPropertyNames(err)));

      const errorMessage = err.response?.data?.message || err.message || 'Failed to create class. Please try again.';
      setError(errorMessage);
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
      {/* Create Button - Top */}
      <div className="flex justify-end pb-2">
        <Button
          variant="primary"
          size="lg"
          onClick={wizardState.classId ? () => onComplete?.(wizardState.classId!) : handleCreate}
          loading={isCreating}
          disabled={isCreating}
          icon={!isCreating ? <Check className="w-5 h-5" /> : undefined}
        >
          {isCreating ? (loadingMessage || 'Creating Class...') : wizardState.classId ? 'Continue to Class' : 'Create Class'}
        </Button>
      </div>

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

      {/* Generated Units - Full Preview */}
      {wizardState.generatedUnits && wizardState.generatedUnits.length > 0 && (
        <GlassCard variant="elevated">
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">AI-Generated Curriculum ({wizardState.generatedUnits.length} Units)</h3>
                  <p className="text-sm text-gray-600">Extracted from {wizardState.curriculumFiles.length} file(s)</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto modal-scroll">
              {wizardState.generatedUnits.map((unit: any, index: number) => (
                <motion.div
                  key={unit.id || index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 rounded-xl bg-white border border-gray-200"
                >
                  <div className="space-y-3">
                    {/* Unit Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{unit.title}</h4>
                        {unit.description && (
                          <p className="text-sm text-gray-600 mt-1">{unit.description}</p>
                        )}
                      </div>
                      {unit.estimatedWeeks && (
                        <span className="text-xs text-gray-600 bg-gray-100 px-3 py-1 rounded-full ml-3">
                          {unit.estimatedWeeks} weeks
                        </span>
                      )}
                    </div>

                    {/* Topics */}
                    {unit.topics && unit.topics.length > 0 && (
                      <div className="pt-3 border-t border-gray-100">
                        <p className="text-xs font-semibold text-gray-700 mb-2">Topics ({unit.topics.length}):</p>
                        <div className="flex flex-wrap gap-2">
                          {unit.topics.map((topic: any, i: number) => (
                            <span key={i} className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-lg">
                              {typeof topic === 'string' ? topic : topic.name || topic.title}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Learning Objectives */}
                    {unit.learningObjectives && unit.learningObjectives.length > 0 && (
                      <div className="pt-3 border-t border-gray-100">
                        <p className="text-xs font-semibold text-gray-700 mb-2">Learning Objectives:</p>
                        <ul className="space-y-1">
                          {unit.learningObjectives.slice(0, 3).map((obj: string, i: number) => (
                            <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                              <span className="w-1 h-1 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                              <span>{obj}</span>
                            </li>
                          ))}
                          {unit.learningObjectives.length > 3 && (
                            <li className="text-sm text-gray-500 pl-3">
                              +{unit.learningObjectives.length - 3} more objectives
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-600">
                💡 Units will be created in this order. You can edit and reorder them after class creation.
              </p>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Curriculum Status (if no AI-generated units) */}
      {(!wizardState.generatedUnits || wizardState.generatedUnits.length === 0) && wizardState.curriculumFiles.length > 0 && (
        <GlassCard variant="elevated">
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Curriculum</h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-600" />
                <p className="font-medium text-gray-900">
                  AI-Generated Curriculum Schedule
                </p>
              </div>

              <div className="pl-7 space-y-2">
                <p className="text-sm text-gray-600 font-medium">
                  Uploaded Files ({wizardState.curriculumFiles.length}):
                </p>
                {wizardState.curriculumFiles.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                    <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <span className="truncate">{file.name}</span>
                  </div>
                ))}
                {wizardState.aiPreferences.targetUnits && (
                  <p className="text-sm text-gray-600 mt-3">
                    {wizardState.aiPreferences.targetUnits} units •{' '}
                    {wizardState.aiPreferences.pacingPreference} pacing
                  </p>
                )}
              </div>
            </div>
          </div>
        </GlassCard>
      )}

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

    </div>
  );
};

export default ReviewClassStep;
