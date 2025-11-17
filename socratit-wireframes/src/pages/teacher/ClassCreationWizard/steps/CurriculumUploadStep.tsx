// ============================================================================
// CURRICULUM UPLOAD STEP
// Second step: Upload and process curriculum with AI
// ============================================================================

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Upload, Sparkles, CheckCircle2 } from 'lucide-react';
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTask, setCurrentTask] = useState('');
  const [error, setError] = useState('');

  const handleFilesSelect = (files: File[]) => {
    onUpdate({ curriculumFiles: files });
    setError('');
  };

  const handleContinue = async () => {
    if (wizardState.curriculumFiles.length === 0) {
      setError('Please upload at least one curriculum file');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setError('');

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
        setProgress(10 + (i + 1) / wizardState.curriculumFiles.length * 20);
      }

      onUpdate({ curriculumMaterialIds: fileIds });

      // Step 2: Wait for file processing
      setCurrentTask('Processing file...');
      setProgress(30);

      let processingComplete = false;
      let attempts = 0;
      const maxAttempts = 15;

      while (!processingComplete && attempts < maxAttempts) {
        try {
          const status = await uploadService.getCurriculumStatus(fileIds[0]);

          if (status.processingStatus === 'COMPLETED') {
            processingComplete = true;
            setProgress(50);
          } else if (status.processingStatus === 'FAILED') {
            throw new Error('File processing failed');
          } else {
            await new Promise(resolve => setTimeout(resolve, 2000));
            attempts++;
            setProgress(30 + (attempts / maxAttempts) * 20);
          }
        } catch (statusError) {
          console.warn('Status check failed:', statusError);
          break;
        }
      }

      // Step 3: Generate curriculum with AI
      setCurrentTask('Analyzing curriculum with AI...');
      setProgress(50);

      // Use current year for dates
      const currentYear = new Date().getFullYear();
      const schoolYearStart = new Date(currentYear, 7, 1); // Aug 1
      const schoolYearEnd = new Date(currentYear + 1, 5, 30); // June 30

      const aiResult = await curriculumApi.schedules.generateCurriculumPreview({
        curriculumMaterialId: fileIds[0],
        schoolYearStart: schoolYearStart.toISOString(),
        schoolYearEnd: schoolYearEnd.toISOString(),
        meetingPattern: 'daily',
        preferences: {
          targetUnits: 8,
          pacingPreference: 'standard',
        },
      });

      setProgress(90);
      setCurrentTask('Processing units...');

      const units = aiResult.units || [];

      setProgress(100);
      setCurrentTask('Complete!');

      // Store generated units and proceed
      onUpdate({
        generatedUnits: units,
        curriculumMaterialIds: fileIds
      });

      setTimeout(() => {
        onNext();
      }, 500);

    } catch (err: any) {
      console.error('Processing error:', err);
      setError(err.message || 'Failed to process curriculum');
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {!isProcessing && (
        <>
          {/* Next Button - Top */}
          <div className="flex justify-end pb-2 pr-2">
            <Button
              variant="primary"
              size="lg"
              onClick={handleContinue}
              disabled={wizardState.curriculumFiles.length === 0}
            >
              {t('common.buttons.continue')}
            </Button>
          </div>

          {/* File Upload Section */}
          <GlassCard variant="elevated">
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Upload className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Upload Curriculum
                  </h3>
                  <p className="text-sm text-gray-600">
                    AI will analyze and create units
                  </p>
                </div>
              </div>

              <MultiFileUpload
                accept=".pdf,.docx,.txt"
                maxSize={10 * 1024 * 1024}
                maxFiles={5}
                currentFiles={wizardState.curriculumFiles}
                onFilesSelect={handleFilesSelect}
              />

              {wizardState.curriculumFiles.length > 0 && (
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    {wizardState.curriculumFiles.length} file(s) selected
                  </p>
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
            </div>
          </GlassCard>
        </>
      )}

      {/* Processing State */}
      {isProcessing && (
        <GlassCard variant="elevated">
          <div className="p-8 text-center space-y-6">
            <div className="flex justify-center">
              <CircularProgress value={progress} size={120} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600 animate-pulse" />
                <h3 className="text-lg font-semibold text-gray-900">
                  {currentTask}
                </h3>
              </div>
              <p className="text-sm text-gray-600">
                This may take 1-2 minutes...
              </p>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
};

export default CurriculumUploadStep;
