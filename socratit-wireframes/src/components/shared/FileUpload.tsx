// ============================================================================
// FILE UPLOAD COMPONENT
// Apple-style drag-and-drop file upload with preview
// ============================================================================

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, File, FileText, X, CheckCircle, AlertCircle, Loader } from 'lucide-react';

interface FileUploadProps {
  label?: string;
  accept?: string;
  maxSize?: number; // in MB
  onFileSelect: (file: File) => void;
  onFileRemove?: () => void;
  currentFile?: File | null;
  error?: string;
  helperText?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  multiple?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  label,
  accept = '.pdf,.doc,.docx',
  maxSize = 100, // 100MB default (increased from 10MB to support larger curriculum files)
  onFileSelect,
  onFileRemove,
  currentFile,
  error,
  helperText,
  className = '',
  required = false,
  disabled = false,
  multiple = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const validateFile = (file: File): string | null => {
    // Check file size
    const maxSizeBytes = maxSize * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `File size must be less than ${maxSize}MB`;
    }

    // Check file type
    if (accept) {
      const acceptedTypes = accept.split(',').map(t => t.trim());
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      const isAccepted = acceptedTypes.some(type => {
        if (type.startsWith('.')) {
          return fileExtension === type.toLowerCase();
        }
        return file.type.match(type.replace('*', '.*'));
      });

      if (!isAccepted) {
        return `File type not supported. Accepted types: ${accept}`;
      }
    }

    return null;
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    const validationError = validateFile(file);

    if (validationError) {
      setUploadError(validationError);
      return;
    }

    setUploadError(null);
    onFileSelect(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    handleFiles(e.dataTransfer.files);
  }, [disabled, accept, maxSize]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setUploadError(null);
    onFileRemove?.();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (extension === 'pdf') {
      return <File className="w-6 h-6 text-red-500" />;
    }
    return <FileText className="w-6 h-6 text-blue-500" />;
  };

  const displayError = error || uploadError;

  return (
    <div className={className}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled}
        multiple={multiple}
        aria-label={label || 'File upload'}
        aria-required={required}
      />

      {/* Upload Area */}
      {!currentFile ? (
        <motion.div
          onClick={handleClick}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          whileHover={!disabled ? { scale: 1.01 } : {}}
          whileTap={!disabled ? { scale: 0.99 } : {}}
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-label={`Upload file${multiple ? 's' : ''}: ${label || 'File upload'}`}
          aria-disabled={disabled}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleClick();
            }
          }}
          className={`
            relative px-6 py-8 rounded-2xl border-2 border-dashed
            ${isDragging
              ? 'border-blue-400 bg-blue-50/50'
              : displayError
                ? 'border-red-300 bg-red-50/30'
                : 'border-gray-300 bg-white/70'
            }
            backdrop-blur-xl
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-blue-400 hover:bg-blue-50/30'}
            transition-all duration-200
          `}
        >
          <div className="flex flex-col items-center text-center">
            {/* Upload Icon */}
            <motion.div
              animate={isDragging ? { scale: 1.1 } : { scale: 1 }}
              className={`
                w-16 h-16 rounded-full flex items-center justify-center mb-4
                ${isDragging ? 'bg-blue-100' : 'bg-gray-100'}
                transition-colors duration-200
              `}
            >
              <Upload className={`w-8 h-8 ${isDragging ? 'text-blue-600' : 'text-gray-400'}`} />
            </motion.div>

            {/* Instructions */}
            <p className="text-base font-medium text-gray-900 mb-1">
              {isDragging ? 'Drop file here' : 'Drag and drop file here'}
            </p>
            <p className="text-sm text-gray-500 mb-3">
              or click to browse
            </p>

            {/* File Info */}
            <p className="text-xs text-gray-400">
              Supported formats: {accept.split(',').join(', ')} • Max size: {maxSize}MB
            </p>
          </div>
        </motion.div>
      ) : (
        /* File Preview */
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative px-6 py-4 rounded-2xl border border-gray-200 bg-white/90 backdrop-blur-xl"
        >
          <div className="flex items-center gap-4">
            {/* File Icon */}
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
              {getFileIcon(currentFile.name)}
            </div>

            {/* File Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {currentFile.name}
              </p>
              <p className="text-xs text-gray-500">
                {formatFileSize(currentFile.size)}
              </p>
            </div>

            {/* Success Icon */}
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />

            {/* Remove Button */}
            <button
              onClick={handleRemove}
              disabled={disabled}
              className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-red-50 flex items-center justify-center transition-colors disabled:opacity-50"
              aria-label="Remove file"
            >
              <X className="w-4 h-4 text-gray-600 hover:text-red-600" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Helper Text or Error */}
      {(helperText || displayError) && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mt-2 text-sm flex items-center gap-1 ${displayError ? 'text-red-600' : 'text-gray-500'}`}
        >
          {displayError && <AlertCircle className="w-4 h-4" />}
          {displayError || helperText}
        </motion.p>
      )}
    </div>
  );
};

// ============================================================================
// MULTI FILE UPLOAD COMPONENT
// ============================================================================

interface MultiFileUploadProps {
  label?: string;
  accept?: string;
  maxSize?: number;
  maxFiles?: number;
  onFilesSelect: (files: File[]) => void;
  currentFiles?: File[];
  error?: string;
  helperText?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
}

export const MultiFileUpload: React.FC<MultiFileUploadProps> = ({
  label,
  accept = '.pdf,.doc,.docx',
  maxSize = 100, // 100MB default (increased from 10MB)
  maxFiles = 5,
  onFilesSelect,
  currentFiles = [],
  error,
  helperText,
  className = '',
  required = false,
  disabled = false,
}) => {
  const [files, setFiles] = useState<File[]>(currentFiles);

  const handleFileSelect = (file: File) => {
    if (files.length >= maxFiles) {
      return;
    }
    const newFiles = [...files, file];
    setFiles(newFiles);
    onFilesSelect(newFiles);
  };

  const handleFileRemove = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onFilesSelect(newFiles);
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2 mb-4">
          <AnimatePresence>
            {files.map((file, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="px-4 py-3 rounded-xl border border-gray-200 bg-white/90 backdrop-blur-xl flex items-center gap-3"
              >
                <FileText className="w-5 h-5 text-blue-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.name}
                  </p>
                </div>
                <button
                  onClick={() => handleFileRemove(index)}
                  disabled={disabled}
                  className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-red-50 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Upload Area */}
      {files.length < maxFiles && (
        <FileUpload
          accept={accept}
          maxSize={maxSize}
          onFileSelect={handleFileSelect}
          disabled={disabled}
          helperText={`${files.length}/${maxFiles} files uploaded`}
        />
      )}

      {error && (
        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {error}
        </p>
      )}
    </div>
  );
};

export default FileUpload;
