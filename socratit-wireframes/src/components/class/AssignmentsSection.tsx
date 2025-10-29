// ============================================================================
// ASSIGNMENTS SECTION COMPONENT
// Displays recent assignments in class dashboard
// ============================================================================

import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Plus, Calendar, CheckCircle, Clock } from 'lucide-react';
import { CollapsibleSection } from './CollapsibleSection';
import { Button } from '../curriculum/Button';
import { format } from 'date-fns';

interface Assignment {
  id: string;
  title: string;
  dueDate: string;
  totalSubmissions: number;
  totalStudents: number;
  unitTitle?: string;
}

interface AssignmentsSectionProps {
  assignments: Assignment[];
  onViewAll?: () => void;
  onCreateAssignment?: () => void;
  onAssignmentClick?: (assignment: Assignment) => void;
}

export const AssignmentsSection: React.FC<AssignmentsSectionProps> = ({
  assignments,
  onViewAll,
  onCreateAssignment,
  onAssignmentClick,
}) => {
  const getSubmissionPercentage = (assignment: Assignment) => {
    if (assignment.totalStudents === 0) return 0;
    return Math.round((assignment.totalSubmissions / assignment.totalStudents) * 100);
  };

  const getStatusColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <CollapsibleSection
      title="Recent Assignments"
      subtitle={`${assignments.length} ${assignments.length === 1 ? 'assignment' : 'assignments'}`}
      icon={<FileText className="w-5 h-5 text-white" />}
      defaultExpanded={false}
      action={
        onCreateAssignment && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCreateAssignment}
            icon={<Plus className="w-4 h-4" />}
          >
            Create Assignment
          </Button>
        )
      }
    >
      <div className="space-y-3">
        {assignments.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600 mb-4">
              No assignments created yet
            </p>
            {onCreateAssignment && (
              <Button
                variant="primary"
                onClick={onCreateAssignment}
                icon={<Plus className="w-4 h-4" />}
              >
                Create First Assignment
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Assignment List */}
            <div className="space-y-2">
              {assignments.slice(0, 5).map((assignment, index) => {
                const submissionPercentage = getSubmissionPercentage(assignment);
                const isPastDue = new Date(assignment.dueDate) < new Date();

                return (
                  <motion.div
                    key={assignment.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ x: 4 }}
                    onClick={() => onAssignmentClick?.(assignment)}
                    className="p-4 rounded-lg bg-white/70 border border-gray-200 hover:border-blue-300 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-1">
                          {assignment.title}
                        </h4>
                        {assignment.unitTitle && (
                          <p className="text-xs text-gray-600">
                            {assignment.unitTitle}
                          </p>
                        )}
                      </div>
                      {isPastDue && (
                        <span className="px-2 py-1 rounded-md bg-red-100 text-red-700 text-xs font-medium">
                          Past Due
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      {/* Due Date */}
                      <div className="flex items-center gap-1 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>Due {format(new Date(assignment.dueDate), 'MMM d')}</span>
                      </div>

                      {/* Submissions */}
                      <div className="flex items-center gap-2">
                        <div className={`flex items-center gap-1 font-semibold ${getStatusColor(submissionPercentage)}`}>
                          {submissionPercentage === 100 ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Clock className="w-4 h-4" />
                          )}
                          <span>
                            {assignment.totalSubmissions}/{assignment.totalStudents}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* View All Link */}
            {assignments.length > 5 && (
              <div className="text-center pt-2">
                <button
                  onClick={onViewAll}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View all {assignments.length} assignments →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </CollapsibleSection>
  );
};

export default AssignmentsSection;
