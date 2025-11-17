// ============================================================================
// CURRICULUM UPLOAD STEP
// Second step: Upload curriculum materials
// ============================================================================

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Upload, CheckCircle2 } from 'lucide-react';
import { MultiFileUpload } from '../../../../components/shared/FileUpload';
import { Button } from '../../../../components/curriculum/Button';
import { GlassCard } from '../../../../components/curriculum/GlassCard';
import { useLanguage } from '../../../../contexts/LanguageContext';
import type { ClassCreationState } from '../ClassCreationWizard';
import { uploadService } from '../../../../services/upload.service';

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
  const [uploadedFileIds, setUploadedFileIds] = useState<string[]>([]);

  const handleFilesSelect = (files: File[]) => {
    onUpdate({ curriculumFiles: files });
  };

  const handleContinue = async () => {
    if (wizardState.curriculumFiles.length === 0) {
      onNext();
      return;
    }

    setIsUploading(true);

    try {
      // Upload files
      const fileIds: string[] = [];
      for (const file of wizardState.curriculumFiles) {
        const uploadedFile = await uploadService.uploadCurriculumFile(file);
        fileIds.push(uploadedFile.id);
      }

      setUploadedFileIds(fileIds);
      onUpdate({ curriculumMaterialIds: fileIds });

      // Proceed to next step
      onNext();
    } catch (error: any) {
      console.error('Upload error:', error);
      alert(`Failed to upload files: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Next Button - Top */}
      <div className="flex justify-end pb-2 pr-2">
        <Button
          variant="primary"
          size="lg"
          onClick={handleContinue}
          loading={isUploading}
          disabled={isUploading || wizardState.curriculumFiles.length === 0}
        >
          {isUploading ? 'Uploading...' : t('common.buttons.continue')}
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
                Upload Curriculum Files
              </h3>
              <p className="text-sm text-gray-600">
                Upload your curriculum materials (PDF, DOCX, or TXT files)
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
        </div>
      </GlassCard>

      {/* Info Card */}
      <GlassCard>
        <div className="p-4 flex items-start gap-3">
          <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-600">
            <p className="font-medium text-gray-900 mb-1">Supported Files</p>
            <ul className="list-disc list-inside space-y-1">
              <li>PDF documents (.pdf)</li>
              <li>Word documents (.docx)</li>
              <li>Text files (.txt)</li>
              <li>Maximum 10MB per file</li>
              <li>Up to 5 files total</li>
            </ul>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default CurriculumUploadStep;
