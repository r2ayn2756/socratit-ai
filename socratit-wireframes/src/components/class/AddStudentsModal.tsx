// ============================================================================
// ADD STUDENTS MODAL
// Modal for teachers to manually add students to a class by email
// ============================================================================

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, AlertCircle, CheckCircle, Mail } from 'lucide-react';
import { classService, AddStudentsDTO } from '../../services/class.service';

interface AddStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  className: string;
}

export const AddStudentsModal: React.FC<AddStudentsModalProps> = ({
  isOpen,
  onClose,
  classId,
  className,
}) => {
  const queryClient = useQueryClient();
  const [emails, setEmails] = useState<string[]>(['']);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);

  const addStudentsMutation = useMutation({
    mutationFn: (data: AddStudentsDTO) => classService.addStudentsToClass(classId, data),
    onSuccess: (response) => {
      setSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['class-enrollments', classId] });
      queryClient.invalidateQueries({ queryKey: ['class', classId] });

      setTimeout(() => {
        handleClose();
      }, 2000);
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to add students';
      setError(errorMessage);
    },
  });

  const handleClose = () => {
    setEmails(['']);
    setError('');
    setSuccess(false);
    onClose();
  };

  const handleAddEmail = () => {
    setEmails([...emails, '']);
  };

  const handleRemoveEmail = (index: number) => {
    if (emails.length > 1) {
      setEmails(emails.filter((_, i) => i !== index));
    }
  };

  const handleEmailChange = (index: number, value: string) => {
    const newEmails = [...emails];
    newEmails[index] = value;
    setEmails(newEmails);
    setError('');
  };

  const validateEmails = (): boolean => {
    const validEmails = emails.filter(email => email.trim() !== '');

    if (validEmails.length === 0) {
      setError('Please enter at least one email address');
      return false;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = validEmails.filter(email => !emailPattern.test(email));

    if (invalidEmails.length > 0) {
      setError(`Invalid email format: ${invalidEmails.join(', ')}`);
      return false;
    }

    // Check for duplicates
    const uniqueEmails = new Set(validEmails);
    if (uniqueEmails.size !== validEmails.length) {
      setError('Duplicate email addresses detected');
      return false;
    }

    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmails()) {
      return;
    }

    const validEmails = emails.filter(email => email.trim() !== '');
    addStudentsMutation.mutate({ studentEmails: validEmails });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Add Students</h2>
              <p className="text-sm text-gray-600 mt-1">
                Add students to <span className="font-medium">{className}</span>
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={addStudentsMutation.isPending}
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6">
            {/* Success Message */}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3"
              >
                <CheckCircle className="text-green-600 flex-shrink-0" size={24} />
                <div>
                  <p className="font-medium text-green-900">Students added successfully!</p>
                  <p className="text-sm text-green-700">
                    They will be enrolled with APPROVED status automatically.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3"
              >
                <AlertCircle className="text-red-600 flex-shrink-0" size={24} />
                <p className="text-sm text-red-800">{error}</p>
              </motion.div>
            )}

            {/* Instructions */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>Note:</strong> Students added manually will be automatically approved.
                They must be registered users in your school to be added.
              </p>
            </div>

            {/* Email Inputs */}
            <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
              {emails.map((email, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3"
                >
                  <div className="flex-1 relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => handleEmailChange(index, e.target.value)}
                      placeholder={`Student email ${index + 1}`}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={addStudentsMutation.isPending || success}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveEmail(index)}
                    disabled={emails.length === 1 || addStudentsMutation.isPending || success}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 size={20} />
                  </button>
                </motion.div>
              ))}
            </div>

            {/* Add More Button */}
            <button
              type="button"
              onClick={handleAddEmail}
              disabled={addStudentsMutation.isPending || success}
              className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors mb-6 disabled:opacity-50"
            >
              <Plus size={20} />
              <span>Add another email</span>
            </button>

            {/* Actions */}
            <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={addStudentsMutation.isPending}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={addStudentsMutation.isPending || success}
                className="px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addStudentsMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Adding...</span>
                  </>
                ) : (
                  <>
                    <Plus size={20} />
                    <span>Add Students</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
