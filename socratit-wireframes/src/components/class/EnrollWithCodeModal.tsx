// ============================================================================
// ENROLL WITH CODE MODAL
// Modal for students to enroll in a class using a class code
// ============================================================================

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { classService } from '../../services/class.service';
import { Button } from '../common/Button';

interface EnrollWithCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EnrollWithCodeModal: React.FC<EnrollWithCodeModalProps> = ({ isOpen, onClose }) => {
  const [classCode, setClassCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const queryClient = useQueryClient();

  const enrollMutation = useMutation({
    mutationFn: (code: string) => classService.enrollWithCode({ classCode: code }),
    onSuccess: (data) => {
      setSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['student-enrollments'] });
      setTimeout(() => {
        handleClose();
      }, 2000);
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Invalid class code. Please try again.';
      setError(errorMessage);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate format (XXX-1234)
    const codePattern = /^[A-Z]{3}-[0-9]{4}$/;
    const upperCode = classCode.toUpperCase().trim();

    if (!codePattern.test(upperCode)) {
      setError('Invalid format. Code should be like: ABC-1234');
      return;
    }

    enrollMutation.mutate(upperCode);
  };

  const handleClose = () => {
    setClassCode('');
    setError('');
    setSuccess(false);
    onClose();
  };

  const formatClassCode = (value: string) => {
    // Remove any non-alphanumeric characters except hyphen
    let cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '');

    // Auto-insert hyphen after 3 characters
    if (cleaned.length > 3) {
      cleaned = cleaned.slice(0, 3) + '-' + cleaned.slice(3, 7);
    }

    return cleaned;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatClassCode(e.target.value);
    setClassCode(formatted);
    setError(''); // Clear error on input change
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-brand-purple to-purple-600 p-6 text-white relative">
                <button
                  onClick={handleClose}
                  className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Enroll in Class</h2>
                    <p className="text-sm opacity-90 mt-1">Enter your class code to join</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {success ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-8"
                  >
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Request Sent!</h3>
                    <p className="text-slate-600">
                      Your enrollment request has been submitted. You'll be notified when the teacher approves it.
                    </p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Class Code
                      </label>
                      <input
                        type="text"
                        value={classCode}
                        onChange={handleInputChange}
                        placeholder="ABC-1234"
                        maxLength={8}
                        className={`w-full px-4 py-3 text-center text-2xl font-mono font-bold tracking-wider border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-purple/20 transition-colors ${
                          error
                            ? 'border-red-300 bg-red-50'
                            : 'border-slate-200 bg-slate-50 focus:border-brand-purple'
                        }`}
                        disabled={enrollMutation.isPending}
                        autoFocus
                      />
                      <p className="text-xs text-slate-500 mt-2">
                        Format: 3 letters, hyphen, 4 numbers (e.g., GEO-1234)
                      </p>
                    </div>

                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-lg"
                      >
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-red-900">Enrollment Failed</p>
                          <p className="text-sm text-red-700 mt-1">{error}</p>
                        </div>
                      </motion.div>
                    )}

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-900">
                        <strong>Tip:</strong> Ask your teacher for the class code. After you enter it,
                        your request will be sent to the teacher for approval.
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="secondary"
                        className="flex-1"
                        onClick={handleClose}
                        disabled={enrollMutation.isPending}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        className="flex-1"
                        disabled={enrollMutation.isPending || classCode.length < 8}
                      >
                        {enrollMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Enrolling...
                          </>
                        ) : (
                          'Enroll'
                        )}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
