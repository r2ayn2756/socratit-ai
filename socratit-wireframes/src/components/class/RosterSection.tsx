// ============================================================================
// ROSTER SECTION COMPONENT
// Displays student roster in class dashboard
// ============================================================================

import React from 'react';
import { motion } from 'framer-motion';
import { Users, UserPlus, Mail, BarChart, Clock, AlertCircle } from 'lucide-react';
import { CollapsibleSection } from './CollapsibleSection';
import { Button } from '../common/Button';
import { EmptyState } from '../common/EmptyState';

interface Student {
  id: string;
  name: string;
  email: string;
  enrollmentStatus: string;
  averageScore?: number;
}

interface EnrollmentWithStudent {
  id: string;
  status: string;
  requestedAt: string;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    gradeLevel?: string;
  };
}

interface RosterSectionProps {
  students: Student[];
  pendingEnrollments?: EnrollmentWithStudent[];
  onViewFull?: () => void;
  onAddStudent?: () => void;
  onStudentClick?: (student: Student) => void;
}

export const RosterSection: React.FC<RosterSectionProps> = ({
  students,
  pendingEnrollments = [],
  onViewFull,
  onAddStudent,
  onStudentClick,
}) => {
  const totalEnrolled = students.length;
  const totalPending = pendingEnrollments.length;

  return (
    <CollapsibleSection
      title="Class Roster"
      subtitle={`${totalEnrolled} enrolled${totalPending > 0 ? `, ${totalPending} pending` : ''}`}
      icon={<Users className="w-5 h-5 text-white" />}
      defaultExpanded={false}
      action={
        onAddStudent && (
          <button
            onClick={onAddStudent}
            className="p-2 rounded-lg hover:bg-neutral-100 transition-colors text-neutral-600 hover:text-primary-600"
            aria-label="Add Student"
          >
            <UserPlus className="w-5 h-5" />
          </button>
        )
      }
    >
      <div className="space-y-4">
        {/* Pending Enrollments Section */}
        {totalPending > 0 && (
          <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-yellow-700" />
              <h3 className="font-semibold text-yellow-900">
                Pending Approval ({totalPending})
              </h3>
            </div>
            <div className="space-y-2">
              {pendingEnrollments.slice(0, 3).map((enrollment, index) => (
                <motion.div
                  key={enrollment.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-2 rounded-lg bg-white border border-yellow-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-semibold text-xs">
                        {enrollment.student.firstName[0]}{enrollment.student.lastName[0]}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">
                        {enrollment.student.firstName} {enrollment.student.lastName}
                      </p>
                      <p className="text-xs text-gray-600 truncate">
                        {enrollment.student.email}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
              {totalPending > 3 && (
                <button
                  onClick={onViewFull}
                  className="text-sm text-yellow-700 hover:text-yellow-800 font-medium"
                >
                  View {totalPending - 3} more pending →
                </button>
              )}
            </div>
          </div>
        )}

        {/* Enrolled Students Section */}
        {students.length === 0 && totalPending === 0 ? (
          <EmptyState
            icon={Users}
            title="No Students Enrolled Yet"
            message="Get started by adding students to your class. They'll receive an invitation to join."
            action={
              onAddStudent
                ? {
                    label: 'Add First Student',
                    onClick: onAddStudent,
                    icon: UserPlus,
                  }
                : undefined
            }
          />
        ) : students.length > 0 ? (
          <>
            {totalPending > 0 && (
              <div className="flex items-center gap-2 pt-2">
                <Users className="w-4 h-4 text-gray-600" />
                <h3 className="font-semibold text-gray-900">
                  Enrolled Students ({totalEnrolled})
                </h3>
              </div>
            )}
            {/* Student List */}
            <div className="space-y-2">
              {students.slice(0, 5).map((student, index) => (
                <motion.div
                  key={student.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ x: 4 }}
                  onClick={() => onStudentClick?.(student)}
                  className="p-3 rounded-lg bg-white/70 border border-neutral-200 hover:border-primary-300 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-secondary-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-semibold text-sm">
                        {student.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-neutral-900 truncate">
                        {student.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Mail className="w-3 h-3 text-neutral-400" />
                        <p className="text-xs text-neutral-600 truncate">
                          {student.email}
                        </p>
                      </div>
                    </div>

                    {/* Score */}
                    {student.averageScore !== undefined && (
                      <div className="flex items-center gap-1 text-sm">
                        <BarChart className="w-4 h-4 text-neutral-400" />
                        <span className="font-semibold text-neutral-900">
                          {student.averageScore}%
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* View All Link */}
            {(students.length > 5 || totalPending > 3) && (
              <div className="text-center pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onViewFull}
                >
                  View full roster ({totalEnrolled} enrolled{totalPending > 0 ? `, ${totalPending} pending` : ''}) →
                </Button>
              </div>
            )}
          </>
        ) : null}
      </div>
    </CollapsibleSection>
  );
};

export default RosterSection;
