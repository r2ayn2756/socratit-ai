// ============================================================================
// CURRICULUM UPLOAD STEP
// Third step: Upload curriculum materials (optional)
// ============================================================================

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Upload, Sparkles, ArrowRight } from 'lucide-react';
import { MultiFileUpload } from '../../../../components/shared/FileUpload';
import { Button } from '../../../../components/curriculum/Button';
import { GlassCard } from '../../../../components/curriculum/GlassCard';
import { CircularProgress } from '../../../../components/curriculum/ProgressBar';
import { useLanguage } from '../../../../contexts/LanguageContext';
import type { ClassCreationState } from '../ClassCreationWizard';
import { uploadService } from '../../../../services/upload.service';
import { curriculumApi } from '../../../../services/curriculumApi.service';

interface CurriculumUploadStepProps {
  wizardState: ClassCreationState;
  onUpdate: (updates: Partial<ClassCreationState>) => void;
  onNext: () => void;
  onBack: () => void;
}

export const CurriculumUploadStep: React.FC<CurriculumUploadStepProps> = ({
  wizardState,
  onUpdate,
  onNext,
}) => {
  const { t } = useLanguage();
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTask, setCurrentTask] = useState('');

  const handleFilesSelect = async (files: File[]) => {
    onUpdate({ curriculumFiles: files, skipCurriculum: false });
  };

  const handleSkip = () => {
    onUpdate({ skipCurriculum: true, curriculumFiles: [] });
    onNext();
  };

  const handleContinue = async () => {
    if (wizardState.curriculumFiles.length === 0) {
      onUpdate({ skipCurriculum: false });
      onNext();
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      // Step 1: Upload files
      setCurrentTask('Uploading curriculum files...');
      setProgress(10);

      const fileIds: string[] = [];
      for (let i = 0; i < wizardState.curriculumFiles.length; i++) {
        const file = wizardState.curriculumFiles[i];
        setCurrentTask(`Uploading ${file.name}... (${i + 1}/${wizardState.curriculumFiles.length})`);

        const uploadedFile = await uploadService.uploadCurriculumFile(file);
        fileIds.push(uploadedFile.id);
        setProgress(10 + (i + 1) / wizardState.curriculumFiles.length * 30);
      }

      // Step 2: Process with AI
      setCurrentTask('Analyzing curriculum with AI...');
      setProgress(45);

      try {
        const targetUnits = wizardState.aiPreferences.targetUnits || 8;
        const pacingPreference = wizardState.aiPreferences.pacingPreference || 'standard';

        const aiResult = await curriculumApi.schedules.generateCurriculumPreview({
          curriculumMaterialId: fileIds[0],
          schoolYearStart: wizardState.schoolYearStart!.toISOString(),
          schoolYearEnd: wizardState.schoolYearEnd!.toISOString(),
          meetingPattern: wizardState.meetingPattern,
          preferences: {
            targetUnits,
            pacingPreference: pacingPreference as any,
          },
        });

        setProgress(90);
        const extractedUnits = aiResult.units || [];

        setProgress(100);
        setCurrentTask('Complete!');

        // Update state with uploaded files and extracted units
        onUpdate({
          curriculumMaterialIds: fileIds,
          generatedUnits: extractedUnits,
          skipCurriculum: false,
        });

        setTimeout(() => {
          onNext();
        }, 500);

      } catch (aiError) {
        console.error('AI processing failed:', aiError);

        // Fallback: create mock units
        const targetUnits = wizardState.aiPreferences.targetUnits || 8;
        const mockUnits = Array.from({ length: targetUnits }, (_, i) => ({
          id: `preview-unit-${i + 1}`,
          title: `Unit ${i + 1}`,
          description: `AI analysis pending. Topics will be generated when class is created.`,
          topics: [],
          learningObjectives: [],
          estimatedWeeks: Math.ceil(40 / targetUnits),
        }));

        onUpdate({
          curriculumMaterialIds: fileIds,
          generatedUnits: mockUnits,
          skipCurriculum: false,
        });

        setTimeout(() => {
          onNext();
        }, 500);
      }

    } catch (error: any) {
      console.error('Upload failed:', error);
      setCurrentTask('Upload failed. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8">
      {!isProcessing ? (
        <>
          {/* Navigation - Top */}
          <div className="flex justify-end pb-2">
            {wizardState.curriculumFiles.length > 0 ? (
              <Button
                variant="primary"
                size="lg"
                onClick={handleContinue}
                icon={<Sparkles className="w-4 h-4" />}
              >
                {t('common.buttons.continue')}
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="lg"
                onClick={handleSkip}
              >
                {t('classWizard.curriculum.skipCurriculum')}
              </Button>
            )}
          </div>

          {/* Upload Section */}
          <div>
            <MultiFileUpload
              label={t('classWizard.curriculum.uploadTitle')}
              accept=".pdf,.doc,.docx"
              maxSize={100}
              maxFiles={10}
              onFilesSelect={handleFilesSelect}
              currentFiles={wizardState.curriculumFiles}
              helperText={t('classWizard.curriculum.uploadDesc')}
              disabled={false}
            />
          </div>

          {/* What AI Will Do */}
          <GlassCard variant="elevated" padding="lg" className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-100">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-2">
                  What AI Will Do With Your Curriculum
                </h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                    <span>Extract topics, concepts, and learning objectives</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                    <span>Analyze difficulty levels for appropriate pacing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                    <span>Generate a year-long schedule aligned with your school calendar</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                    <span>Organize content into logical units with time estimates</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                    <span>Suggest assignments and assessment points for each unit</span>
                  </li>
                </ul>
              </div>
            </div>
          </GlassCard>
        </>
      ) : (
        // Processing State
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="py-12"
        >
          <div className="max-w-md mx-auto text-center">
            <div className="mb-8">
              <CircularProgress
                progress={progress}
                size={120}
                color="blue"
                showPercentage
              />
            </div>

            <motion.div
              key={currentTask}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-center gap-2 text-blue-600">
                <Sparkles className="w-5 h-5 animate-pulse" />
                <p className="font-medium">Processing curriculum...</p>
              </div>
              <p className="text-sm text-gray-600">{currentTask}</p>
            </motion.div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default CurriculumUploadStep;
