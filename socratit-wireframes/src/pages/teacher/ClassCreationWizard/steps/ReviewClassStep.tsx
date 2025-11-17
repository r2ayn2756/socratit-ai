// ============================================================================
// REVIEW CLASS STEP
// Final step: Review and create the class
// ============================================================================

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, BookOpen, Calendar, FileText, Sparkles, AlertCircle, Edit2, Trash2, Plus } from 'lucide-react';
import { Button } from '../../../../components/curriculum/Button';
import { GlassCard } from '../../../../components/curriculum/GlassCard';
import { useLanguage } from '../../../../contexts/LanguageContext';
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
  const { t } = useLanguage();
  const [isCreating, setIsCreating] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
  const [editingUnit, setEditingUnit] = useState<any>(null);

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

      // Step 2: Create class with curriculum schedule
      const currentYear = new Date().getFullYear();
      const schoolYearStart = new Date(currentYear, 7, 1); // Aug 1
      const schoolYearEnd = new Date(currentYear + 1, 5, 30); // June 30

      const classData: any = {
        name: wizardState.className,
        subject: wizardState.subject || '',
        gradeLevel: wizardState.gradeLevel || '',
        academicYear: `${currentYear}-${currentYear + 1}`,
        color: 'blue',
      };

      if (wizardState.description) {
        classData.description = wizardState.description;
      }

      // Add curriculum schedule data
      if (curriculumMaterialIds.length > 0) {
        classData.curriculumMaterialId = curriculumMaterialIds[0];
        classData.schoolYearStart = schoolYearStart.toISOString();
        classData.schoolYearEnd = schoolYearEnd.toISOString();
        classData.meetingPattern = 'daily';
        classData.generateWithAI = false; // Units already generated
        classData.preGeneratedUnits = wizardState.generatedUnits || [];
      }

      const newClass = await classCurriculumService.createClass(classData);

      // Update wizard state with created class ID
      onUpdate({ classId: newClass.id });

      // Complete wizard and navigate to class dashboard
      if (onComplete) {
        onComplete(newClass.id);
      }
    } catch (err: any) {
      console.error('Class creation failed:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create class. Please try again.';
      setError(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditUnit = (unit: any) => {
    setEditingUnitId(unit.id);
    setEditingUnit({ ...unit });
  };

  const handleSaveUnit = () => {
    if (!editingUnit || !wizardState.generatedUnits) return;

    const updatedUnits = wizardState.generatedUnits.map(unit =>
      unit.id === editingUnit.id ? editingUnit : unit
    );

    onUpdate({ generatedUnits: updatedUnits });
    setEditingUnitId(null);
    setEditingUnit(null);
  };

  const handleCancelEdit = () => {
    setEditingUnitId(null);
    setEditingUnit(null);
  };

  const handleDeleteUnit = (unitId: string) => {
    if (!wizardState.generatedUnits) return;

    const updatedUnits = wizardState.generatedUnits.filter(unit => unit.id !== unitId);
    onUpdate({ generatedUnits: updatedUnits });
  };

  const handleAddTopic = () => {
    if (!editingUnit) return;
    setEditingUnit({
      ...editingUnit,
      topics: [...(editingUnit.topics || []), ''],
    });
  };

  const handleUpdateTopic = (index: number, value: string) => {
    if (!editingUnit) return;
    const newTopics = [...(editingUnit.topics || [])];
    newTopics[index] = value;
    setEditingUnit({ ...editingUnit, topics: newTopics });
  };

  const handleRemoveTopic = (index: number) => {
    if (!editingUnit) return;
    const newTopics = editingUnit.topics.filter((_: any, i: number) => i !== index);
    setEditingUnit({ ...editingUnit, topics: newTopics });
  };

  return (
    <div className="space-y-6">
      {/* Create Button - Top */}
      <div className="flex justify-end pb-2 pr-2">
        <Button
          variant="primary"
          size="lg"
          onClick={wizardState.classId ? () => onComplete?.(wizardState.classId!) : handleCreate}
          loading={isCreating}
          disabled={isCreating}
          icon={!isCreating ? <Check className="w-5 h-5" /> : undefined}
        >
          {isCreating ? (loadingMessage || t('classWizard.review.creating')) : wizardState.classId ? t('common.buttons.continue') : t('classWizard.review.createClass')}
        </Button>
      </div>

      {/* Class Details */}
      <GlassCard variant="elevated">
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-blue-600" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">{t('classWizard.review.classInfo')}</h3>
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-xs text-gray-600">{t('classWizard.details.className')}</p>
                <p className="text-sm font-medium text-gray-900">{wizardState.className}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">{t('classWizard.details.subject')}</p>
                <p className="text-sm font-medium text-gray-900">{wizardState.subject}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">{t('classWizard.details.gradeLevel')}</p>
                <p className="text-sm font-medium text-gray-900">{wizardState.gradeLevel}</p>
              </div>
            </div>

            {wizardState.description && (
              <div>
                <p className="text-xs text-gray-600">{t('classWizard.details.description')}</p>
                <p className="text-gray-700 text-xs">{wizardState.description}</p>
              </div>
            )}
          </div>
        </div>
      </GlassCard>

      {/* Generated Units - Full Preview */}
      {wizardState.generatedUnits && wizardState.generatedUnits.length > 0 && (
        <GlassCard variant="elevated">
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900">{t('classWizard.review.curriculum')} ({wizardState.generatedUnits.length} Units)</h3>
                  <p className="text-xs text-gray-600">{t('classWizard.curriculum.filesUploaded').replace('{count}', wizardState.curriculumFiles.length.toString())}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {wizardState.generatedUnits.map((unit: any, index: number) => {
                const isEditing = editingUnitId === unit.id;
                const displayUnit = isEditing ? editingUnit : unit;

                return (
                  <motion.div
                    key={unit.id || index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-3 rounded-lg bg-white border ${isEditing ? 'border-blue-400 shadow-md' : 'border-gray-200'}`}
                  >
                    {isEditing ? (
                      // EDIT MODE
                      <div className="space-y-4">
                        {/* Unit Title & Description */}
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={displayUnit.title}
                            onChange={(e) => setEditingUnit({ ...editingUnit, title: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none font-semibold"
                            placeholder="Unit title"
                          />
                          <textarea
                            value={displayUnit.description || ''}
                            onChange={(e) => setEditingUnit({ ...editingUnit, description: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm"
                            placeholder="Unit description"
                            rows={2}
                          />
                          <input
                            type="number"
                            value={displayUnit.estimatedWeeks || ''}
                            onChange={(e) => setEditingUnit({ ...editingUnit, estimatedWeeks: parseInt(e.target.value) || 0 })}
                            className="w-32 px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm"
                            placeholder="Weeks"
                            min="1"
                          />
                        </div>

                        {/* Topics */}
                        <div className="pt-3 border-t border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-semibold text-gray-700">Topics:</p>
                            <button
                              onClick={handleAddTopic}
                              className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" />
                              Add Topic
                            </button>
                          </div>
                          <div className="space-y-2">
                            {(displayUnit.topics || []).map((topic: any, i: number) => (
                              <div key={i} className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={typeof topic === 'string' ? topic : topic.name || topic.title || ''}
                                  onChange={(e) => handleUpdateTopic(i, e.target.value)}
                                  className="flex-1 px-2 py-1 rounded border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none text-sm"
                                  placeholder="Topic name"
                                />
                                <button
                                  onClick={() => handleRemoveTopic(i)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
                          <Button variant="primary" size="sm" onClick={handleSaveUnit}>
                            {t('common.buttons.save')}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                            {t('common.buttons.cancel')}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // VIEW MODE
                      <div className="space-y-3">
                        {/* Unit Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{displayUnit.title}</h4>
                            {displayUnit.description && (
                              <p className="text-sm text-gray-600 mt-1">{displayUnit.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 ml-3">
                            {displayUnit.estimatedWeeks && (
                              <span className="text-xs text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                                {displayUnit.estimatedWeeks} weeks
                              </span>
                            )}
                            <button
                              onClick={() => handleEditUnit(unit)}
                              className="text-gray-400 hover:text-blue-600 transition-colors"
                              title="Edit unit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteUnit(unit.id)}
                              className="text-gray-400 hover:text-red-600 transition-colors"
                              title="Delete unit"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Topics */}
                        {displayUnit.topics && displayUnit.topics.length > 0 && (
                          <div className="pt-2 border-t border-gray-100">
                            <p className="text-xs font-semibold text-gray-700 mb-1.5">Topics ({displayUnit.topics.length}):</p>
                            <div className="flex flex-wrap gap-1.5">
                              {displayUnit.topics.map((topic: any, i: number) => (
                                <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                                  {typeof topic === 'string' ? topic : topic.name || topic.title}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Learning Objectives */}
                        {displayUnit.learningObjectives && displayUnit.learningObjectives.length > 0 && (
                          <div className="pt-2 border-t border-gray-100">
                            <p className="text-xs font-semibold text-gray-700 mb-1.5">Learning Objectives:</p>
                            <ul className="space-y-0.5">
                              {displayUnit.learningObjectives.slice(0, 2).map((obj: string, i: number) => (
                                <li key={i} className="text-xs text-gray-700 flex items-start gap-1.5">
                                  <span className="w-1 h-1 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                                  <span>{obj}</span>
                                </li>
                              ))}
                              {displayUnit.learningObjectives.length > 2 && (
                                <li className="text-xs text-gray-500 pl-2.5">
                                  +{displayUnit.learningObjectives.length - 2} more
                                </li>
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-600">
                💡 Click <Edit2 className="w-3 h-3 inline" /> to edit unit details, or <Trash2 className="w-3 h-3 inline" /> to remove a unit. Units will be created in this order.
              </p>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Curriculum Status (if no AI-generated units) */}
      {(!wizardState.generatedUnits || wizardState.generatedUnits.length === 0) && wizardState.curriculumFiles.length > 0 && (
        <GlassCard variant="elevated">
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-green-600" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">{t('classWizard.review.curriculum')}</h3>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600" />
                <p className="text-sm font-medium text-gray-900">
                  {t('classWizard.review.curriculum')}
                </p>
              </div>

              <div className="pl-6 space-y-1.5">
                <p className="text-xs text-gray-600 font-medium">
                  {t('classWizard.curriculum.filesUploaded').replace('{count}', wizardState.curriculumFiles.length.toString())}:
                </p>
                {wizardState.curriculumFiles.map((file, index) => (
                  <div key={index} className="flex items-center gap-1.5 text-xs text-gray-600">
                    <FileText className="w-3 h-3 text-blue-500 flex-shrink-0" />
                    <span className="truncate">{file.name}</span>
                  </div>
                ))}
                {wizardState.aiPreferences.targetUnits && (
                  <p className="text-xs text-gray-600 mt-2">
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
