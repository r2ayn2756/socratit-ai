// ============================================================================
// UNIT DETAILS MODAL
// Enterprise-quality expandable unit details with Apple glass UI
// ============================================================================

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  BookOpen,
  Target,
  Lightbulb,
  CheckCircle,
  FileText,
  ChevronDown,
  ChevronUp,
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
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['subunits', 'objectives'])
  );

  if (!unit) return null;

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const getStatusColor = (status: string) => {
    const colors = {
      SCHEDULED: 'bg-blue-100 text-blue-700 border-blue-300',
      IN_PROGRESS: 'bg-green-100 text-green-700 border-green-300',
      COMPLETED: 'bg-gray-100 text-gray-700 border-gray-300',
      SKIPPED: 'bg-red-100 text-red-700 border-red-300',
    };
    return colors[status as keyof typeof colors] || colors.SCHEDULED;
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
                <div className="flex-1 overflow-y-auto p-6 space-y-6 modal-scroll">
                  {/* Sub-Units Section - Clickable with Generate Assignment */}
                  {unit.subUnits && unit.subUnits.length > 0 && (
                    <CollapsibleSection
                      title="Sub-Units & Topics"
                      icon={<BookOpen className="w-5 h-5" />}
                      isExpanded={expandedSections.has('subunits')}
                      onToggle={() => toggleSection('subunits')}
                    >
                      <div className="space-y-3">
                        {unit.subUnits.map((subUnit, idx) => (
                          <motion.div
                            key={subUnit.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="p-4 rounded-xl bg-gradient-to-br from-white/90 to-white/70 border border-gray-200/50 hover:border-primary-300 hover:shadow-md transition-all group"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="px-2 py-0.5 rounded-md bg-primary-100 text-primary-700 text-xs font-semibold">
                                    {idx + 1}
                                  </span>
                                  <h4 className="font-semibold text-gray-900 text-sm">
                                    {subUnit.name}
                                  </h4>
                                </div>
                                {subUnit.description && (
                                  <p className="text-sm text-gray-600 mt-2">
                                    {subUnit.description}
                                  </p>
                                )}
                              </div>

                              {/* Generate Assignment Button - Only for Teachers */}
                              {userRole === 'teacher' && onGenerateAssignment && (
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => onGenerateAssignment(subUnit)}
                                  className="ml-3 px-3 py-2 rounded-lg bg-gradient-to-r from-primary-500 to-secondary-600 text-white text-sm font-medium hover:shadow-lg transition-all flex items-center gap-2 opacity-0 group-hover:opacity-100"
                                >
                                  <Sparkles className="w-4 h-4" />
                                  Generate Assignment
                                </motion.button>
                              )}
                            </div>

                            {/* Sub-unit Details */}
                            <div className="mt-3 space-y-2">
                              {/* Learning Objectives */}
                              {subUnit.learningObjectives && subUnit.learningObjectives.length > 0 && (
                                <div>
                                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                                    Objectives
                                  </p>
                                  <ul className="space-y-1">
                                    {subUnit.learningObjectives.map((obj, objIdx) => (
                                      <li
                                        key={objIdx}
                                        className="text-sm text-gray-700 flex items-start gap-2"
                                      >
                                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                        <span>{obj}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Concepts */}
                              {subUnit.concepts && subUnit.concepts.length > 0 && (
                                <div>
                                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                                    Key Concepts
                                  </p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {subUnit.concepts.map((concept, conceptIdx) => (
                                      <span
                                        key={conceptIdx}
                                        className="px-2 py-1 rounded-md bg-purple-100 text-purple-700 text-xs font-medium"
                                      >
                                        {concept}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </CollapsibleSection>
                  )}

                  {/* Learning Objectives */}
                  {unit.learningObjectives && unit.learningObjectives.length > 0 && (
                    <CollapsibleSection
                      title="Learning Objectives"
                      icon={<Target className="w-5 h-5" />}
                      isExpanded={expandedSections.has('objectives')}
                      onToggle={() => toggleSection('objectives')}
                    >
                      <ul className="space-y-2">
                        {unit.learningObjectives.map((objective, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-3 p-3 rounded-lg bg-white/70 border border-gray-200/50"
                          >
                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-gray-700">{objective}</span>
                          </li>
                        ))}
                      </ul>
                    </CollapsibleSection>
                  )}

                  {/* Key Concepts */}
                  {unit.concepts && unit.concepts.length > 0 && (
                    <CollapsibleSection
                      title="Key Concepts"
                      icon={<Lightbulb className="w-5 h-5" />}
                      isExpanded={expandedSections.has('concepts')}
                      onToggle={() => toggleSection('concepts')}
                    >
                      <div className="flex flex-wrap gap-2">
                        {unit.concepts.map((concept, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 text-sm font-medium border border-purple-200/50"
                          >
                            {concept}
                          </span>
                        ))}
                      </div>
                    </CollapsibleSection>
                  )}

                  {/* Assignments */}
                  {unit.suggestedAssessments && (unit.suggestedAssessments as any[]).length > 0 && (
                    <CollapsibleSection
                      title="Suggested Assessments"
                      icon={<FileText className="w-5 h-5" />}
                      isExpanded={expandedSections.has('assessments')}
                      onToggle={() => toggleSection('assessments')}
                    >
                      <div className="space-y-2">
                        {(unit.suggestedAssessments as any[]).map((assessment, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-lg bg-white/70 border border-gray-200/50 flex items-center justify-between"
                          >
                            <div>
                              <p className="font-medium text-gray-900 capitalize">
                                {assessment.type}
                              </p>
                              <p className="text-xs text-gray-600">
                                {assessment.timing} of unit • ~{assessment.estimatedQuestions}{' '}
                                questions
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CollapsibleSection>
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

// Collapsible Section Component
interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  icon,
  isExpanded,
  onToggle,
  children,
}) => {
  return (
    <div className="rounded-xl bg-gradient-to-br from-gray-50 to-white border border-gray-200/50 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
            {icon}
          </div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-4 pt-0">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UnitDetailsModal;
