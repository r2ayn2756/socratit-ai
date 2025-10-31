// ============================================================================
// LESSON CARD COMPONENT
// Displays a summary of a class lesson
// ============================================================================

import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, BookOpen, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import type { ClassLesson } from '../../types/lesson.types';

interface LessonCardProps {
  lesson: ClassLesson;
  onClick: () => void;
}

export const LessonCard: React.FC<LessonCardProps> = ({ lesson, onClick }) => {
  const formatDuration = (seconds: number | null): string => {
    if (!seconds) return 'Unknown';
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins} min`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hours}h ${remainingMins}m`;
  };

  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: '0 12px 24px rgba(0, 0, 0, 0.1)' }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-white/90 backdrop-blur-2xl border border-gray-200/50 rounded-xl p-5 cursor-pointer transition-all duration-200 hover:border-blue-300"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="text-lg font-bold text-gray-900 mb-1 line-clamp-2">{lesson.title}</h4>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{format(new Date(lesson.lessonDate), 'MMM d, yyyy')}</span>
            </div>
            {lesson.durationSeconds && (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{formatDuration(lesson.durationSeconds)}</span>
              </div>
            )}
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" />
      </div>

      {/* Summary */}
      <p className="text-sm text-gray-700 mb-3 line-clamp-2">{lesson.summary}</p>

      {/* Footer */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium">
          <BookOpen className="w-3.5 h-3.5" />
          <span>{lesson.keyConcepts.length} concepts</span>
        </div>
        {lesson.actionItems.length > 0 && (
          <div className="px-2.5 py-1 rounded-lg bg-orange-50 text-orange-700 text-xs font-medium">
            {lesson.actionItems.length} action items
          </div>
        )}
        {lesson.homework && (
          <div className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 text-xs font-medium">
            Homework
          </div>
        )}
      </div>
    </motion.div>
  );
};
