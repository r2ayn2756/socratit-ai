// ============================================================================
// STRUGGLING STUDENTS COMPONENT
// Display list of students requiring intervention with priority indicators
// ============================================================================

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  TrendingDown,
  Clock,
  BookOpen,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Mail,
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../common/Card';
import { Badge } from '../common/Badge';
import {
  formatAlertSeverity,
  getAlertColor,
  AlertSeverity,
} from '../../types/analytics.types';

interface StrugglingStudent {
  studentId: string;
  firstName: string;
  lastName: string;
  interventionLevel: AlertSeverity;
  averageScore?: number;
  completionRate?: number;
  hasMissedAssignments?: boolean;
  hasDecliningGrade?: boolean;
  hasConceptGaps?: boolean;
  hasLowEngagement?: boolean;
  strugglingConcepts?: string[];
  recommendations?: string[];
  lastActivityDate?: string;
}

interface StrugglingStudentsProps {
  students: any[];
  title?: string;
  onContactStudent?: (studentId: string) => void;
  showDetails?: boolean;
}

export const StrugglingStudents: React.FC<StrugglingStudentsProps> = ({
  students,
  title = 'Students Needing Support',
  onContactStudent,
  showDetails = true,
}) => {
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);

  // Sort by intervention level (CRITICAL first)
  const sortedStudents = [...students].sort((a: any, b: any) => {
    const severityOrder: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    return (
      severityOrder[a.interventionLevel] - severityOrder[b.interventionLevel]
    );
  });

  // Count by severity
  const criticalCount = students.filter(s => s.interventionLevel === 'CRITICAL').length;
  const highCount = students.filter(s => s.interventionLevel === 'HIGH').length;
  const mediumCount = students.filter(s => s.interventionLevel === 'MEDIUM').length;

  const getSeverityIcon = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'HIGH':
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'MEDIUM':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-blue-600" />;
    }
  };

  const getSeverityBgClass = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return 'bg-gradient-to-br from-red-50 to-red-100 border-red-200';
      case 'HIGH':
        return 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200';
      case 'MEDIUM':
        return 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200';
      default:
        return 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200';
    }
  };

  const toggleExpanded = (studentId: string) => {
    setExpandedStudent(expandedStudent === studentId ? null : studentId);
  };

  return (
    <Card variant="elevated">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-500/30">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            <p className="text-sm text-slate-600">
              {students.length} student{students.length !== 1 ? 's' : ''} identified
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* Summary Statistics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-3 border border-red-200">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="text-xs font-medium text-red-700">Critical</span>
              </div>
              <div className="text-2xl font-bold text-red-900">{criticalCount}</div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-3 border border-orange-200">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-orange-600" />
                <span className="text-xs font-medium text-orange-700">High</span>
              </div>
              <div className="text-2xl font-bold text-orange-900">{highCount}</div>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-3 border border-yellow-200">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                <span className="text-xs font-medium text-yellow-700">Medium</span>
              </div>
              <div className="text-2xl font-bold text-yellow-900">{mediumCount}</div>
            </div>
          </div>

          {/* Student List */}
          <div className="space-y-2 pt-4 border-t border-slate-200">
            {sortedStudents.map((student, index) => (
              <motion.div
                key={student.studentId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`rounded-xl border-2 overflow-hidden ${getSeverityBgClass(
                  student.interventionLevel
                )}`}
              >
                {/* Student Header */}
                <div
                  className="p-4 cursor-pointer hover:bg-white/50 transition-colors"
                  onClick={() => showDetails && toggleExpanded(student.studentId)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-slate-900">
                          {student.firstName} {student.lastName}
                        </h4>
                        <Badge
                          variant={
                            student.interventionLevel === 'CRITICAL'
                              ? 'error'
                              : student.interventionLevel === 'HIGH'
                              ? 'warning'
                              : student.interventionLevel === 'MEDIUM'
                              ? 'warning'
                              : 'primary'
                          }
                          size="sm"
                        >
                          {formatAlertSeverity(student.interventionLevel)}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-3 mt-2 text-sm text-slate-600">
                        {student.averageScore !== undefined && (
                          <span className="font-medium">
                            Avg: {student.averageScore.toFixed(1)}%
                          </span>
                        )}
                        {student.completionRate !== undefined && (
                          <span>Completion: {student.completionRate.toFixed(0)}%</span>
                        )}
                      </div>

                      {/* Issue Indicators */}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {student.hasMissedAssignments && (
                          <div className="flex items-center gap-1 text-xs bg-white/70 px-2 py-1 rounded-lg">
                            <Clock className="w-3 h-3 text-orange-600" />
                            <span className="text-slate-700">Missed Work</span>
                          </div>
                        )}
                        {student.hasDecliningGrade && (
                          <div className="flex items-center gap-1 text-xs bg-white/70 px-2 py-1 rounded-lg">
                            <TrendingDown className="w-3 h-3 text-red-600" />
                            <span className="text-slate-700">Declining</span>
                          </div>
                        )}
                        {student.hasConceptGaps && (
                          <div className="flex items-center gap-1 text-xs bg-white/70 px-2 py-1 rounded-lg">
                            <BookOpen className="w-3 h-3 text-purple-600" />
                            <span className="text-slate-700">Concept Gaps</span>
                          </div>
                        )}
                        {student.hasLowEngagement && (
                          <div className="flex items-center gap-1 text-xs bg-white/70 px-2 py-1 rounded-lg">
                            <MessageSquare className="w-3 h-3 text-blue-600" />
                            <span className="text-slate-700">Low Engagement</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {onContactStudent && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onContactStudent(student.studentId);
                          }}
                          className="p-2 bg-white/70 hover:bg-white rounded-lg transition-colors"
                          title="Contact student"
                        >
                          <Mail className="w-4 h-4 text-slate-700" />
                        </button>
                      )}
                      {showDetails && (
                        <div className="text-slate-600">
                          {expandedStudent === student.studentId ? (
                            <ChevronUp className="w-5 h-5" />
                          ) : (
                            <ChevronDown className="w-5 h-5" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {showDetails && expandedStudent === student.studentId && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-white/50"
                    >
                      <div className="p-4 bg-white/30 space-y-3">
                        {/* Struggling Concepts */}
                        {student.strugglingConcepts && student.strugglingConcepts.length > 0 && (
                          <div>
                            <h5 className="text-xs font-semibold text-slate-700 mb-2">
                              Struggling Concepts:
                            </h5>
                            <div className="flex flex-wrap gap-1">
                              {student.strugglingConcepts.map((concept: string, idx: number) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 bg-white/70 rounded-lg text-xs text-slate-700"
                                >
                                  {concept}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Recommendations */}
                        {student.recommendations && student.recommendations.length > 0 && (
                          <div>
                            <h5 className="text-xs font-semibold text-slate-700 mb-2">
                              Recommended Actions:
                            </h5>
                            <ul className="space-y-1">
                              {student.recommendations.map((rec: string, idx: number) => (
                                <li
                                  key={idx}
                                  className="text-xs text-slate-700 flex items-start gap-2"
                                >
                                  <span className="text-orange-600 mt-0.5">•</span>
                                  <span>{rec}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Last Activity */}
                        {student.lastActivityDate && (
                          <div className="text-xs text-slate-600">
                            Last active:{' '}
                            {new Date(student.lastActivityDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>

          {/* Empty State */}
          {students.length === 0 && (
            <div className="text-center py-12">
              <AlertTriangle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 font-medium">
                No students needing intervention
              </p>
              <p className="text-sm text-slate-500 mt-1">
                All students are performing well!
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
