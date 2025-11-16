// ============================================================================
// CURRICULUM UPLOAD STEP
// Third step: Upload curriculum materials (optional)
// ============================================================================

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Upload, Sparkles, ArrowRight } from 'lucide-react';
import { FileUpload } from '../../../../components/shared/FileUpload';
import { Button } from '../../../../components/curriculum/Button';
import { GlassCard } from '../../../../components/curriculum/GlassCard';
import type { ClassCreationState } from '../ClassCreationWizard';

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
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = async (file: File) => {
    setIsUploading(true);

    // Simulate upload (in real implementation, upload to backend)
    await new Promise(resolve => setTimeout(resolve, 1000));

    onUpdate({ curriculumFile: file, skipCurriculum: false });
    setIsUploading(false);
  };

  const handleFileRemove = () => {
    onUpdate({ curriculumFile: null });
  };

  const handleSkip = () => {
    onUpdate({ skipCurriculum: true, curriculumFile: null });
    onNext();
  };

  const handleContinue = () => {
    onUpdate({ skipCurriculum: false });
    onNext();
  };

  return (
    <div className="space-y-8">
      {/* Navigation - Top */}
      <div className="flex justify-end pb-2">
        {wizardState.curriculumFile ? (
          <Button
            variant="primary"
            size="lg"
            onClick={handleContinue}
            loading={isUploading}
            icon={<Sparkles className="w-4 h-4" />}
          >
            Continue to AI Generation
          </Button>
        ) : (
          <Button
            variant="secondary"
            size="lg"
            onClick={handleSkip}
          >
            Skip This Step
          </Button>
        )}
      </div>

      {/* Upload Section */}
      <div>
        <FileUpload
          label="Curriculum Materials"
          accept=".pdf,.doc,.docx"
          maxSize={100}
          onFileSelect={handleFileSelect}
          onFileRemove={handleFileRemove}
          currentFile={wizardState.curriculumFile}
          helperText="Upload your curriculum guide, syllabus, or course materials (PDF or Word)"
          disabled={isUploading}
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

      {/* Skip Option */}
      {!wizardState.curriculumFile && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center p-6 rounded-2xl bg-gray-50 border border-gray-200"
        >
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <h4 className="font-semibold text-gray-900 mb-2">
            Don't have curriculum materials ready?
          </h4>
          <p className="text-sm text-gray-600 mb-4">
            You can skip this step and add your class without AI-generated curriculum.
            You'll still be able to create assignments and track student progress.
          </p>
          <Button
            variant="ghost"
            onClick={handleSkip}
            icon={<ArrowRight className="w-4 h-4" />}
          >
            Skip Curriculum Upload
          </Button>
        </motion.div>
      )}

    </div>
  );
};

export default CurriculumUploadStep;
