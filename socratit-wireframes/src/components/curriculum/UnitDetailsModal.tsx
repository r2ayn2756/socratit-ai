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
                  {unit.subUnits && unit.subUnits.length > 0 ? (
                    <div className="space-y-3">
                      {unit.subUnits.map((subUnit, idx) => (
                        <motion.button
                          key={subUnit.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          onClick={() => userRole === 'teacher' && onGenerateAssignment?.(subUnit)}
                          disabled={userRole !== 'teacher' || !onGenerateAssignment}
                          className={`
                            w-full p-4 rounded-xl bg-gradient-to-br from-white/90 to-white/70
                            border border-gray-200/50 transition-all text-left
                            ${
                              userRole === 'teacher' && onGenerateAssignment
                                ? 'hover:border-primary-300 hover:shadow-lg cursor-pointer group'
                                : 'cursor-default'
                            }
                          `}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              <span className="px-2.5 py-1 rounded-lg bg-primary-100 text-primary-700 text-sm font-semibold">
                                {idx + 1}
                              </span>
                              <h4 className="font-semibold text-gray-900">
                                {subUnit.name}
                              </h4>
                            </div>

                            <div className="flex items-center gap-3">
                              {/* Performance Percentage */}
                              {subUnit.performancePercentage !== undefined && (
                                <div className={`text-2xl font-bold ${getPerformanceColor(subUnit.performancePercentage)}`}>
                                  {subUnit.performancePercentage}%
                                </div>
                              )}

                              {/* Generate Assignment Icon - Only visible on hover for teachers */}
                              {userRole === 'teacher' && onGenerateAssignment && (
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Sparkles className="w-5 h-5 text-primary-500" />
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.button>
                      ))}
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
