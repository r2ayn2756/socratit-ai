// ============================================================================
// LESSON DETAILS MODAL COMPONENT
// Full view of lesson notes with editing capability for teachers
// ============================================================================

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import {
  X,
  Calendar,
  Clock,
  BookOpen,
  CheckCircle,
  FileText,
  Edit2,
  Save,
  Sparkles,
  Loader,
} from 'lucide-react';
import { format } from 'date-fns';
import type { ClassLesson } from '../../types/lesson.types';
import { lessonService } from '../../services/lesson.service';
import { assignmentService } from '../../services/assignment.service';

interface LessonDetailsModalProps {
  lesson: ClassLesson | null;
  isOpen: boolean;
  onClose: () => void;
  userRole: 'teacher' | 'student';
  onLessonUpdated?: () => void;
}

export const LessonDetailsModal: React.FC<LessonDetailsModalProps> = ({
  lesson,
  isOpen,
  onClose,
  userRole,
  onLessonUpdated,
}) => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [teacherNotes, setTeacherNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Mutation for generating assignment from lesson
  const generateAssignmentMutation = useMutation({
    mutationFn: (lessonId: string) =>
      assignmentService.generateAssignmentFromLesson({
        lessonId,
        numQuestions: 10,
        difficulty: 'mixed',
        assignmentType: 'QUIZ',
      }),
    onSuccess: (assignment) => {
      // Navigate to the edit page for the generated assignment
      navigate(`/teacher/assignments/${assignment.id}/edit`);
    },
    onError: (error: any) => {
      console.error('Failed to generate assignment:', error);
      alert(error.response?.data?.message || 'Failed to generate assignment from lesson. Please try again.');
    },
  });

  const handleCreateAssignment = () => {
    if (!lesson) return;

    if (!lesson.fullTranscript) {
      alert('This lesson does not have a transcript to generate an assignment from.');
      return;
    }

    if (window.confirm('Generate an assignment from this lesson? This will create a quiz with multiple choice questions based on the lesson content.')) {
      generateAssignmentMutation.mutate(lesson.id);
    }
  };

  if (!lesson) return null;

  const formatDuration = (seconds: number | null): string => {
    if (!seconds) return 'Unknown';
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins} minutes`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hours} hour${hours > 1 ? 's' : ''} ${remainingMins} minutes`;
  };

  const handleSaveNotes = async () => {
    setIsSaving(true);
    try {
      await lessonService.updateLesson(lesson.id, {
        teacherNotes: teacherNotes.trim() || undefined,
      });
      setIsEditing(false);
      if (onLessonUpdated) {
        onLessonUpdated();
      }
    } catch (error) {
      console.error('Failed to save notes:', error);
      alert('Failed to save notes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditNotes = () => {
    setTeacherNotes(lesson.teacherNotes || '');
    setIsEditing(true);
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
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="flex items-start justify-between p-6 border-b border-gray-200">
                <div className="flex-1 pr-4">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{lesson.title}</h2>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      <span>{format(new Date(lesson.lessonDate), 'MMMM d, yyyy')}</span>
                    </div>
                    {lesson.durationSeconds && (
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        <span>{formatDuration(lesson.durationSeconds)}</span>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Summary */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Summary
                  </h3>
                  <p className="text-gray-700 leading-relaxed">{lesson.summary}</p>
                </div>

                {/* Key Concepts */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-purple-600" />
                    Key Concepts ({lesson.keyConcepts.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {lesson.keyConcepts.map((concept, index) => (
                      <span
                        key={index}
                        className="px-3 py-1.5 rounded-lg bg-purple-100 text-purple-700 text-sm font-medium"
                      >
                        {concept}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action Items */}
                {lesson.actionItems.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-orange-600" />
                      Action Items ({lesson.actionItems.length})
                    </h3>
                    <ul className="space-y-2">
                      {lesson.actionItems.map((item, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="w-2 h-2 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
                          <span className="text-gray-700">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Homework */}
                {lesson.homework && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-green-600" />
                      Homework
                    </h3>
                    <div className="p-4 rounded-xl bg-green-50 border border-green-200">
                      <p className="text-gray-700">{lesson.homework}</p>
                    </div>
                  </div>
                )}

                {/* Teacher Notes (editable for teachers) */}
                {userRole === 'teacher' && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Edit2 className="w-5 h-5 text-blue-600" />
                        Teacher Notes (Private)
                      </h3>
                      {!isEditing ? (
                        <button
                          onClick={handleEditNotes}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Edit
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setIsEditing(false)}
                            className="text-sm text-gray-600 hover:text-gray-700 font-medium"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSaveNotes}
                            disabled={isSaving}
                            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
                          >
                            <Save className="w-4 h-4" />
                            {isSaving ? 'Saving...' : 'Save'}
                          </button>
                        </div>
                      )}
                    </div>
                    {isEditing ? (
                      <textarea
                        value={teacherNotes}
                        onChange={(e) => setTeacherNotes(e.target.value)}
                        placeholder="Add your private notes about this lesson..."
                        className="w-full h-32 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      />
                    ) : (
                      <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 min-h-[80px]">
                        {lesson.teacherNotes ? (
                          <p className="text-gray-700 whitespace-pre-wrap">{lesson.teacherNotes}</p>
                        ) : (
                          <p className="text-gray-500 italic">No notes added yet</p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Full Transcript (teachers only) */}
                {userRole === 'teacher' && lesson.fullTranscript && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Full Transcript</h3>
                    <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 max-h-64 overflow-y-auto">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {lesson.fullTranscript}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between p-6 border-t border-gray-200">
                {/* Create Assignment Button (Teachers Only) */}
                {userRole === 'teacher' && lesson.fullTranscript && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCreateAssignment}
                    disabled={generateAssignmentMutation.isPending}
                    className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {generateAssignmentMutation.isPending ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Create Assignment
                      </>
                    )}
                  </motion.button>
                )}

                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors ml-auto"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
