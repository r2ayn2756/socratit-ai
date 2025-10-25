// ============================================================================
// EXPORT BUTTON COMPONENT
// Batch 7: Export analytics data to CSV or JSON formats
// ============================================================================

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, FileDown, CheckCircle, Loader, X } from 'lucide-react';
import { exportClassGrades, exportStudentReport } from '../../services/analytics.service';

interface ExportButtonProps {
  type: 'class' | 'student';
  classId?: string;
  studentId?: string;
  format?: 'csv' | 'json';
  label?: string;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  type,
  classId,
  studentId,
  format = 'csv',
  label,
  variant = 'primary',
  size = 'md',
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    setError(null);

    try {
      if (type === 'class' && classId) {
        // Export class grades as CSV
        const blob = await exportClassGrades(classId);
        downloadBlob(blob, `class-${classId}-grades.csv`);
      } else if (type === 'student' && studentId && classId) {
        // Export student report as JSON
        const report = await exportStudentReport(studentId, classId);
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        downloadBlob(blob, `student-${studentId}-report.json`);
      } else {
        throw new Error('Invalid export parameters');
      }

      // Show success animation
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err: any) {
      console.error('Export failed:', err);
      setError(err.message || 'Export failed');
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsExporting(false);
    }
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  // Size classes
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  // Variant classes
  const variantClasses = {
    primary: 'bg-brand-blue hover:bg-blue-600 text-white shadow-lg shadow-blue-500/30',
    secondary: 'bg-slate-600 hover:bg-slate-700 text-white shadow-lg shadow-slate-500/20',
  };

  const defaultLabel = type === 'class' ? 'Export Class Data' : 'Export Report';

  return (
    <div className="relative inline-block">
      <motion.button
        onClick={handleExport}
        disabled={isExporting || showSuccess}
        className={`
          ${sizeClasses[size]}
          ${variantClasses[variant]}
          font-medium rounded-lg
          transition-all duration-200
          disabled:opacity-70 disabled:cursor-not-allowed
          flex items-center gap-2
          ${showSuccess ? 'bg-green-600 hover:bg-green-600' : ''}
        `}
        whileHover={{ scale: isExporting || showSuccess ? 1 : 1.02 }}
        whileTap={{ scale: isExporting || showSuccess ? 1 : 0.98 }}
      >
        <AnimatePresence mode="wait">
          {isExporting ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, rotate: 0 }}
              animate={{ opacity: 1, rotate: 360 }}
              exit={{ opacity: 0 }}
              transition={{ rotate: { duration: 1, repeat: Infinity, ease: 'linear' } }}
            >
              <Loader className={iconSizes[size]} />
            </motion.div>
          ) : showSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
            >
              <CheckCircle className={iconSizes[size]} />
            </motion.div>
          ) : (
            <motion.div
              key="default"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Download className={iconSizes[size]} />
            </motion.div>
          )}
        </AnimatePresence>

        <span>
          {isExporting ? 'Exporting...' : showSuccess ? 'Downloaded!' : label || defaultLabel}
        </span>

        {format === 'csv' && !isExporting && !showSuccess && (
          <span className="text-xs opacity-75 uppercase">{format}</span>
        )}
        {format === 'json' && !isExporting && !showSuccess && (
          <span className="text-xs opacity-75 uppercase">{format}</span>
        )}
      </motion.button>

      {/* Error notification */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 left-0 right-0 bg-red-50 border border-red-200 rounded-lg p-3 shadow-lg z-50"
          >
            <div className="flex items-start gap-2">
              <X className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-medium text-red-900">Export Failed</p>
                <p className="text-xs text-red-700 mt-0.5">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-600 hover:text-red-800 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success notification */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="absolute top-full mt-2 left-0 right-0 bg-green-50 border border-green-200 rounded-lg p-3 shadow-lg z-50 whitespace-nowrap"
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <div className="text-xs font-medium text-green-900">
                File downloaded successfully!
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Multi-format export button with dropdown
interface MultiExportButtonProps {
  classId?: string;
  studentId?: string;
  type: 'class' | 'student';
}

export const MultiExportButton: React.FC<MultiExportButtonProps> = ({
  classId,
  studentId,
  type,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 bg-brand-blue hover:bg-blue-600 text-white text-sm font-medium rounded-lg shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2"
      >
        <FileDown className="w-4 h-4" />
        Export Data
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full mt-2 right-0 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden z-50 min-w-[200px]"
            >
              <div className="p-2 space-y-1">
                {type === 'class' && classId && (
                  <div className="hover:bg-slate-50 rounded-md transition-colors">
                    <ExportButton
                      type="class"
                      classId={classId}
                      format="csv"
                      label="Class Grades (CSV)"
                      variant="secondary"
                      size="sm"
                    />
                  </div>
                )}
                {type === 'student' && studentId && classId && (
                  <div className="hover:bg-slate-50 rounded-md transition-colors">
                    <ExportButton
                      type="student"
                      studentId={studentId}
                      classId={classId}
                      format="json"
                      label="Student Report (JSON)"
                      variant="secondary"
                      size="sm"
                    />
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
