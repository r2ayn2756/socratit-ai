// ============================================================================
// LESSONS SECTION COMPONENT
// Displays all lessons for a class with recording capability
// ============================================================================

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { AudioRecorder } from './AudioRecorder';
import { LessonCard } from './LessonCard';
import { LessonDetailsModal } from './LessonDetailsModal';
import { lessonService } from '../../services/lesson.service';
import type { ClassLesson } from '../../types/lesson.types';

interface LessonsSectionProps {
  classId: string;
  userRole: 'teacher' | 'student';
  showRecorder?: boolean;
}

export const LessonsSection: React.FC<LessonsSectionProps> = ({
  classId,
  userRole,
  showRecorder = false,
}) => {
  const [lessons, setLessons] = useState<ClassLesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState<ClassLesson | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLessons();
  }, [classId]);

  const loadLessons = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await lessonService.getClassLessons(classId);
      setLessons(data);
    } catch (err: any) {
      console.error('Failed to load lessons:', err);
      setError('Failed to load lessons');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLessonClick = (lesson: ClassLesson) => {
    setSelectedLesson(lesson);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedLesson(null);
  };

  const handleLessonCreated = () => {
    loadLessons();
  };

  const handleLessonUpdated = () => {
    loadLessons();
    setShowModal(false);
    setSelectedLesson(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Lesson Notes</h2>
            <p className="text-sm text-gray-600">
              {lessons.length} {lessons.length === 1 ? 'lesson' : 'lessons'} recorded
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-4">
          {/* Audio Recorder (Teachers Only) */}
          {showRecorder && userRole === 'teacher' && (
            <AudioRecorder classId={classId} onLessonCreated={handleLessonCreated} />
          )}

          {/* Error State */}
          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
              {error}
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && lessons.length === 0 && (
            <div className="bg-white/90 backdrop-blur-2xl border border-gray-200/50 rounded-2xl p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Lessons Yet</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {userRole === 'teacher'
                  ? 'Start recording your class sessions to automatically generate structured lesson notes.'
                  : 'Your teacher will record lessons and share notes here.'}
              </p>
            </div>
          )}

          {/* Lessons Grid */}
          {!isLoading && !error && lessons.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lessons.map((lesson) => (
                <LessonCard
                  key={lesson.id}
                  lesson={lesson}
                  onClick={() => handleLessonClick(lesson)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Lesson Details Modal */}
      <LessonDetailsModal
        lesson={selectedLesson}
        isOpen={showModal}
        onClose={handleCloseModal}
        userRole={userRole}
        onLessonUpdated={handleLessonUpdated}
      />
    </motion.div>
  );
};
