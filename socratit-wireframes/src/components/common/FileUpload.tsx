// ============================================================================
// FILE UPLOAD COMPONENT
// Drag-and-drop file upload with validation and progress tracking
// ============================================================================

import React, { useCallback, useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================================
// TYPES
// ============================================================================

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onFileRemove?: () => void;
  acceptedTypes?: string[];
  maxSizeMB?: number;
  label?: string;
  error?: string;
  currentFileName?: string;
  disabled?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  onFileRemove,
  acceptedTypes = ['.pdf', '.docx', '.doc', '.txt', '.jpg', '.jpeg', '.png'],
  maxSizeMB = 100, // 100MB default (increased from 10MB to support larger curriculum files)
  label = 'Upload curriculum file',
  error,
  currentFileName,
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // ============================================================================
  // FILE VALIDATION
  // ============================================================================

  const validateFile = useCallback(
    (file: File): { valid: boolean; error?: string } => {
      // Check file size
      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        return { valid: false, error: `File size must be less than ${maxSizeMB}MB` };
      }

      // Check file type
      const fileExt = `.${file.name.split('.').pop()?.toLowerCase()}`;
      if (!acceptedTypes.includes(fileExt)) {
        return { valid: false, error: `File type not supported. Allowed: ${acceptedTypes.join(', ')}` };
      }

      return { valid: true };
    },
    [maxSizeMB, acceptedTypes]
  );

  // ============================================================================
  // FILE HANDLING
  // ============================================================================

  const handleFile = useCallback(
    (file: File) => {
      setValidationError('');

      const validation = validateFile(file);
      if (!validation.valid) {
        setValidationError(validation.error || 'Invalid file');
        return;
      }

      setSelectedFile(file);
      onFileSelect(file);
    },
    [validateFile, onFileSelect]
  );

  const handleFileInput = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(false);

      const file = event.dataTransfer.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleRemove = useCallback(() => {
    setSelectedFile(null);
    setValidationError('');
    if (onFileRemove) {
      onFileRemove();
    }
  }, [onFileRemove]);

  // ============================================================================
  // FORMAT FILE SIZE
  // ============================================================================

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  // ============================================================================
  // GET FILE ICON
  // ============================================================================

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const iconClass = 'w-10 h-10';

    switch (ext) {
      case 'pdf':
        return <FileText className={`${iconClass} text-red-500`} />;
      case 'doc':
      case 'docx':
        return <FileText className={`${iconClass} text-blue-500`} />;
      case 'txt':
        return <FileText className={`${iconClass} text-gray-500`} />;
      case 'jpg':
      case 'jpeg':
      case 'png':
        return <FileText className={`${iconClass} text-green-500`} />;
      default:
        return <FileText className={`${iconClass} text-gray-400`} />;
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  const displayedFileName = currentFileName || selectedFile?.name;
  const hasFile = !!displayedFileName;

  return (
    <div className="w-full">
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}

      {/* File Upload Area */}
      <div
        className={`
          relative rounded-lg border-2 border-dashed transition-all duration-200
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'}
          ${hasFile ? 'p-4' : 'p-8'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400'}
          ${error || validationError ? 'border-red-300 bg-red-50' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && !hasFile && document.getElementById('file-input')?.click()}
      >
        <input
          id="file-input"
          type="file"
          className="hidden"
          accept={acceptedTypes.join(',')}
          onChange={handleFileInput}
          disabled={disabled}
        />

        <AnimatePresence mode="wait">
          {!hasFile ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center justify-center text-center"
            >
              <Upload className={`w-12 h-12 mb-3 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
              <p className="text-sm font-medium text-gray-700 mb-1">
                {isDragging ? 'Drop file here' : 'Drag and drop or click to upload'}
              </p>
              <p className="text-xs text-gray-500">
                Supported: {acceptedTypes.join(', ')} • Max size: {maxSizeMB}MB
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="file"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex items-center justify-between"
            >
              <div className="flex items-center space-x-3">
                {getFileIcon(displayedFileName)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {displayedFileName}
                  </p>
                  {selectedFile && (
                    <p className="text-xs text-gray-500">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  )}
                </div>
              </div>

              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove();
                  }}
                  className="ml-3 p-1 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {(error || validationError) && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="flex items-center mt-2 text-sm text-red-600"
          >
            <AlertCircle className="w-4 h-4 mr-1" />
            {error || validationError}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Message */}
      {hasFile && !error && !validationError && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center mt-2 text-sm text-green-600"
        >
          <CheckCircle className="w-4 h-4 mr-1" />
          File ready to upload
        </motion.div>
      )}
    </div>
  );
};
