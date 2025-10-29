// ============================================================================
// ROSTER SECTION COMPONENT
// Displays student roster in class dashboard
// ============================================================================

import React from 'react';
import { motion } from 'framer-motion';
import { Users, UserPlus, Mail, BarChart } from 'lucide-react';
import { CollapsibleSection } from './CollapsibleSection';
import { Button } from '../curriculum/Button';

interface Student {
  id: string;
  name: string;
  email: string;
  enrollmentStatus: string;
  averageScore?: number;
}

interface RosterSectionProps {
  students: Student[];
  onViewFull?: () => void;
  onAddStudent?: () => void;
  onStudentClick?: (student: Student) => void;
}

export const RosterSection: React.FC<RosterSectionProps> = ({
  students,
  onViewFull,
  onAddStudent,
  onStudentClick,
}) => {
  return (
    <CollapsibleSection
      title="Class Roster"
      subtitle={`${students.length} ${students.length === 1 ? 'student' : 'students'} enrolled`}
      icon={<Users className="w-5 h-5 text-white" />}
      defaultExpanded={false}
      action={
        onAddStudent && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onAddStudent}
            icon={<UserPlus className="w-4 h-4" />}
          >
            Add Student
          </Button>
        )
      }
    >
      <div className="space-y-3">
        {students.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600 mb-4">
              No students enrolled yet
            </p>
            {onAddStudent && (
              <Button
                variant="primary"
                onClick={onAddStudent}
                icon={<UserPlus className="w-4 h-4" />}
              >
                Add First Student
              </Button>
            )}
          </div>
        ) : (
          <>
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
                  className="p-3 rounded-lg bg-white/70 border border-gray-200 hover:border-blue-300 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-semibold text-sm">
                        {student.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {student.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Mail className="w-3 h-3 text-gray-400" />
                        <p className="text-xs text-gray-600 truncate">
                          {student.email}
                        </p>
                      </div>
                    </div>

                    {/* Score */}
                    {student.averageScore !== undefined && (
                      <div className="flex items-center gap-1 text-sm">
                        <BarChart className="w-4 h-4 text-gray-400" />
                        <span className="font-semibold text-gray-900">
                          {student.averageScore}%
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* View All Link */}
            {students.length > 5 && (
              <div className="text-center pt-2">
                <button
                  onClick={onViewFull}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View all {students.length} students →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </CollapsibleSection>
  );
};

export default RosterSection;
