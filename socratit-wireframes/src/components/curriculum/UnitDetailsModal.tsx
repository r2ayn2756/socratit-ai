// ============================================================================
// UNIT DETAILS MODAL
// Enterprise-quality expandable unit details with Apple glass UI
// ============================================================================

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import type { CurriculumUnit, CurriculumSubUnit } from '../../types/curriculum.types';

interface UnitDetailsModalProps {
  unit: CurriculumUnit | null;
  isOpen: boolean;
  onClose: () => void;
  userRole: 'teacher' | 'student';
  onGenerateAssignment?: (subUnit: CurriculumSubUnit) => void;
}

export const UnitDetailsModal: React.FC<UnitDetailsModalProps> = ({
  unit,
  isOpen,
  onClose,
  userRole,
  onGenerateAssignment,
}) => {
  if (!unit) return null;

  const getStatusColor = (status: string) => {
    const colors = {
      SCHEDULED: 'bg-blue-100 text-blue-700 border-blue-300',
      IN_PROGRESS: 'bg-green-100 text-green-700 border-green-300',
      COMPLETED: 'bg-gray-100 text-gray-700 border-gray-300',
      SKIPPED: 'bg-red-100 text-red-700 border-red-300',
    };
    return colors[status as keyof typeof colors] || colors.SCHEDULED;
  };

  const getPerformanceColor = (percentage?: number) => {
    if (!percentage) return 'text-gray-400';
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-blue-600';
    if (percentage >= 40) return 'text-orange-600';
    return 'text-red-600';
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
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 lg:p-16 pointer-events-none"
          >
            <div className="w-full max-w-4xl max-h-[calc(100vh-4rem)] md:max-h-[calc(100vh-8rem)] overflow-hidden rounded-2xl shadow-2xl pointer-events-auto flex flex-col">
              {/* Glass Effect Container */}
              <div className="bg-white/95 backdrop-blur-xl border border-white/20 shadow-lg flex-1 flex flex-col min-h-0 overflow-hidden">
                {/* Header */}
                <div className="relative p-6 border-b border-gray-200/50">
                  <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full bg-gray-100/80 hover:bg-gray-200/80 transition-colors"
                  >
                    <X size={20} className="text-gray-600" />
                  </button>

                  <div className="flex items-start gap-4 pr-12">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-gray-600">
                          Unit {unit.unitNumber}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-xs font-medium border ${getStatusColor(
                            unit.status
                          )}`}
                        >
                          {unit.status.replace('_', ' ')}
                        </span>
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {unit.title}
                      </h2>
                      {unit.description && (
                        <p className="text-gray-600">{unit.description}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 modal-scroll">
                  {/* Topics List */}
                  {unit.topics && unit.topics.length > 0 ? (
                    <div className="space-y-4">
                      {/* Display Main Topics */}
                      {unit.topics && unit.topics.length > 0 && (
                        <div className="space-y-3">
                          {unit.topics.length > 0 && (
                            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mt-4">
                              Main Topics
                            </h3>
                          )}
                          {unit.topics.map((topic, idx) => (
                            <motion.div
                              key={`topic-${idx}`}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: (unit.subUnits?.length || 0) * 0.05 + idx * 0.05 }}
                              className="p-4 rounded-xl bg-gradient-to-br from-blue-50/50 to-purple-50/50 border border-blue-200/50"
                            >
                              <div className="flex items-start gap-3">
                                <span className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-700 text-sm font-semibold flex-shrink-0">
                                  {(unit.subUnits?.length || 0) + idx + 1}
                                </span>
                                <div className="flex-1">
                                  <h4 className="font-semibold text-gray-900 mb-2">
                                    {topic.name}
                                  </h4>

                                  {/* Subtopics */}
                                  {topic.subtopics && topic.subtopics.length > 0 && (
                                    <div className="mb-3">
                                      <p className="text-xs font-medium text-gray-500 mb-1">Subtopics:</p>
                                      <div className="flex flex-wrap gap-1.5">
                                        {topic.subtopics.map((subtopic, subIdx) => (
                                          <button
                                            key={`subtopic-${idx}-${subIdx}`}
                                            onClick={(e) => {
                                              if (userRole === 'teacher' && onGenerateAssignment) {
                                                e.stopPropagation();
                                                // Create a pseudo-subunit for the subtopic
                                                const pseudoSubUnit = {
                                                  id: `topic-${idx}-subtopic-${subIdx}`,
                                                  unitId: unit.id,
                                                  name: subtopic,
                                                  orderIndex: subIdx,
                                                  concepts: topic.concepts || [],
                                                  learningObjectives: topic.learningObjectives || [],
                                                  estimatedHours: 0,
                                                  aiGenerated: unit.aiGenerated,
                                                  teacherModified: unit.teacherModified,
                                                  createdAt: unit.createdAt,
                                                  updatedAt: unit.updatedAt,
                                                };
                                                onGenerateAssignment(pseudoSubUnit);
                                              }
                                            }}
                                            disabled={userRole !== 'teacher' || !onGenerateAssignment}
                                            className={`
                                              px-2 py-1 rounded-md text-xs font-medium
                                              bg-white border border-blue-200 text-blue-700
                                              ${userRole === 'teacher' && onGenerateAssignment
                                                ? 'hover:bg-blue-50 hover:border-blue-300 cursor-pointer group transition-all'
                                                : 'cursor-default'}
                                            `}
                                          >
                                            <span className="flex items-center gap-1">
                                              {subtopic}
                                              {userRole === 'teacher' && onGenerateAssignment && (
                                                <Sparkles className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                              )}
                                            </span>
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Learning Objectives */}
                                  {topic.learningObjectives && topic.learningObjectives.length > 0 && (
                                    <div className="mb-2">
                                      <p className="text-xs font-medium text-gray-500 mb-1">Learning Objectives:</p>
                                      <ul className="text-sm text-gray-700 space-y-0.5 list-disc list-inside">
                                        {topic.learningObjectives.map((objective, objIdx) => (
                                          <li key={`objective-${idx}-${objIdx}`}>{objective}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}

                                  {/* Key Concepts */}
                                  {topic.concepts && topic.concepts.length > 0 && (
                                    <div>
                                      <p className="text-xs font-medium text-gray-500 mb-1">Key Concepts:</p>
                                      <div className="flex flex-wrap gap-1">
                                        {topic.concepts.map((concept, conIdx) => (
                                          <span
                                            key={`concept-${idx}-${conIdx}`}
                                            className="px-2 py-0.5 rounded-md text-xs bg-purple-100 text-purple-700 border border-purple-200"
                                          >
                                            {concept}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No topics available for this unit</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default UnitDetailsModal;
