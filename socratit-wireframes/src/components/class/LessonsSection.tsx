// ============================================================================
// LESSONS SECTION COMPONENT
// Displays all lessons for a class with recording capability
// ============================================================================

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../common/Card';
import { AudioRecorder } from './AudioRecorder';
import { LessonCard } from './LessonCard';
import { LessonDetailsModal } from './LessonDetailsModal';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { EmptyState } from '../common/EmptyState';
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
    <>
      <Card variant="elevated">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary-500/30">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-neutral-900">Class Materials</h3>
              <p className="text-sm text-neutral-600">
                {lessons.length} {lessons.length === 1 ? 'lesson' : 'lessons'} recorded
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Audio Recorder (Teachers Only) */}
          {showRecorder && userRole === 'teacher' && (
            <div className="mb-6">
              <AudioRecorder classId={classId} onLessonCreated={handleLessonCreated} />
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="p-4 rounded-xl bg-error-50 border border-error-200 text-error-700">
              {error}
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="py-12">
              <LoadingSpinner size="lg" message="Loading lessons..." />
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && lessons.length === 0 && (
            <EmptyState
              icon={BookOpen}
              title="No Lessons Yet"
              message={
                userRole === 'teacher'
                  ? 'Start recording your class sessions to automatically generate structured class materials.'
                  : 'Your teacher will record lessons and share materials here.'
              }
              variant="subtle"
            />
          )}

          {/* Lessons Grid */}
          {!isLoading && !error && lessons.length > 0 && (
            <div className="grid grid-cols-1 gap-4">
              {lessons.map((lesson) => (
                <LessonCard
                  key={lesson.id}
                  lesson={lesson}
                  onClick={() => handleLessonClick(lesson)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lesson Details Modal */}
      <LessonDetailsModal
        lesson={selectedLesson}
        isOpen={showModal}
        onClose={handleCloseModal}
        userRole={userRole}
        onLessonUpdated={handleLessonUpdated}
      />
    </>
  );
};
