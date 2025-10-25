// ============================================================================
// STUDENT CLASSES PAGE
// Shows all student classes with teacher info, schedule, and current grades
// NOW USING REAL BACKEND DATA!
// ============================================================================

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '../../components/layout';
import { Card, Button, Badge } from '../../components/common';
import {
  BookOpen,
  Clock,
  MapPin,
  TrendingUp,
  TrendingDown,
  FileText,
  Brain,
  ChevronRight,
  PlusCircle,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { classService } from '../../services/class.service';
import { assignmentService } from '../../services/assignment.service';
import { EnrollWithCodeModal } from '../../components/class/EnrollWithCodeModal';

// Active Assignments Component
const ActiveAssignments: React.FC<{ classId: string; colors: any }> = ({ classId, colors }) => {
  const { data: assignments, isLoading } = useQuery({
    queryKey: ['class-assignments', classId],
    queryFn: () => assignmentService.getAssignments({ classId, status: 'ACTIVE', limit: 3 }),
  });

  if (isLoading) {
    return (
      <div>
        <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">
          Active Assignments
        </div>
        <div className={`p-4 rounded-lg ${colors.bg} border ${colors.border}`}>
          <Loader2 className={`w-5 h-5 ${colors.text} mx-auto animate-spin`} />
        </div>
      </div>
    );
  }

  const activeAssignments = assignments?.data?.slice(0, 3) || [];

  return (
    <div>
      <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">
        Active Assignments
      </div>
      {activeAssignments.length === 0 ? (
        <div className={`p-4 rounded-lg ${colors.bg} border ${colors.border} text-center`}>
          <FileText className={`w-6 h-6 ${colors.text} mx-auto mb-2`} />
          <p className="text-sm text-slate-600">
            No active assignments at the moment
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {activeAssignments.map((assignment: any) => (
            <div
              key={assignment.id}
              className={`p-3 rounded-lg ${colors.bg} border ${colors.border} hover:shadow-sm transition-shadow`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className={`w-4 h-4 ${colors.text} flex-shrink-0`} />
                    <h4 className="text-sm font-semibold text-slate-900 truncate">
                      {assignment.title}
                    </h4>
                  </div>
                  {assignment.dueDate && (
                    <div className="flex items-center gap-1 text-xs text-slate-600">
                      <Clock className="w-3 h-3" />
                      <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
                <Badge
                  variant={assignment.type === 'TEST' ? 'error' : assignment.type === 'QUIZ' ? 'warning' : 'primary'}
                  size="sm"
                >
                  {assignment.type}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const Classes: React.FC = () => {
  const navigate = useNavigate();
  const [showEnrollModal, setShowEnrollModal] = useState(false);

  // Fetch approved enrollments
  const { data: enrollments, isLoading, error } = useQuery({
    queryKey: ['student-enrollments', 'APPROVED'],
    queryFn: () => classService.getStudentEnrollments({ status: 'APPROVED' }),
  });

  // Fetch pending enrollments
  const { data: pendingEnrollments } = useQuery({
    queryKey: ['student-enrollments', 'PENDING'],
    queryFn: () => classService.getStudentEnrollments({ status: 'PENDING' }),
  });

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const getColorClasses = (color: string) => {
    const colors = {
      blue: {
        gradient: 'from-blue-500 to-blue-600',
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-600'
      },
      purple: {
        gradient: 'from-purple-500 to-purple-600',
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        text: 'text-purple-600'
      },
      orange: {
        gradient: 'from-orange-500 to-orange-600',
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        text: 'text-orange-600'
      },
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  if (isLoading) {
    return (
      <DashboardLayout userRole="student">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-brand-purple" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout userRole="student">
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Error loading classes</h2>
          <p className="text-slate-600">Please try again later</p>
        </div>
      </DashboardLayout>
    );
  }

  const approvedClasses = enrollments || [];
  const pendingCount = pendingEnrollments?.length || 0;

  return (
    <DashboardLayout userRole="student">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="space-y-6"
      >
        {/* Header */}
        <motion.div variants={fadeInUp}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                My Classes
              </h1>
              <p className="text-slate-600">
                You're enrolled in {approvedClasses.length} class{approvedClasses.length !== 1 ? 'es' : ''} this semester
                {pendingCount > 0 && (
                  <span className="ml-2 text-orange-600 font-medium">
                    ({pendingCount} pending approval)
                  </span>
                )}
              </p>
            </div>
            <Button variant="primary" onClick={() => setShowEnrollModal(true)}>
              <PlusCircle className="w-5 h-5 mr-2" />
              Enroll in Class
            </Button>
          </div>
        </motion.div>

        {/* Pending Enrollments Alert */}
        {pendingCount > 0 && (
          <motion.div variants={fadeInUp}>
            <Card className="bg-orange-50 border-orange-200">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-orange-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-orange-900">
                    {pendingCount} Enrollment Request{pendingCount !== 1 ? 's' : ''} Pending
                  </h3>
                  <p className="text-sm text-orange-700 mt-1">
                    Your teacher will review and approve your enrollment request soon.
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Classes and TA Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Classes List - Takes up 2/3 */}
          <div className="lg:col-span-2 space-y-6">
            {approvedClasses.length === 0 ? (
              <Card>
                <div className="text-center py-12">
                  <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No classes yet</h3>
                  <p className="text-slate-600 mb-4">
                    Get started by enrolling in a class using a class code from your teacher
                  </p>
                  <Button variant="primary" onClick={() => setShowEnrollModal(true)}>
                    <PlusCircle className="w-5 h-5 mr-2" />
                    Enroll in Class
                  </Button>
                </div>
              </Card>
            ) : (
              approvedClasses.map((enrollment) => {
                const classData = enrollment.class!;
                const colors = getColorClasses(classData.color || 'blue');
                const primaryTeacher = classData.teachers.find(t => t.isPrimary) || classData.teachers[0];

                return (
                  <motion.div
                    key={enrollment.id}
                    variants={fadeInUp}
                    whileHover={{ scale: 1.01 }}
                    className="cursor-pointer"
                    onClick={() => navigate(`/student/classes/${classData.id}`)}
                  >
                    <Card padding="none" className="overflow-hidden">
                      {/* Class Header with Gradient */}
                      <div className={`p-6 bg-gradient-to-r ${colors.gradient} text-white`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <BookOpen className="w-6 h-6" />
                              <h2 className="text-2xl font-bold">{classData.name}</h2>
                            </div>
                            <div className="flex items-center gap-4 text-sm opacity-90">
                              {classData.scheduleTime && (
                                <div className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  <span>{classData.scheduleTime}</span>
                                </div>
                              )}
                              {classData.room && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  <span>{classData.room}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm opacity-90 mb-1">Overall Grade</div>
                            <div className="text-4xl font-bold">--</div>
                            <div className="text-xs opacity-75">Coming in Batch 4</div>
                          </div>
                        </div>
                      </div>

                      {/* Class Details */}
                      <div className="p-6 bg-white">
                        <div className="grid grid-cols-2 gap-6 mb-6">
                          {/* Teacher & Schedule */}
                          <div>
                            <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                              Instructor
                            </div>
                            <div className="text-lg font-bold text-slate-900 mb-3">
                              {primaryTeacher ? `${primaryTeacher.firstName} ${primaryTeacher.lastName}` : 'No teacher assigned'}
                            </div>
                            {classData.period && (
                              <>
                                <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                                  Period
                                </div>
                                <div className="text-sm text-slate-700">
                                  {classData.period}
                                </div>
                              </>
                            )}
                          </div>

                          {/* Class Info */}
                          <div>
                            <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                              Academic Year
                            </div>
                            <div className="text-lg font-bold text-slate-900 mb-3">
                              {classData.academicYear}
                            </div>
                            {classData.subject && (
                              <>
                                <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                                  Subject
                                </div>
                                <div className="text-sm text-slate-700">
                                  {classData.subject}
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Active Assignments */}
                        <ActiveAssignments classId={classData.id} colors={colors} />

                        {/* View Details Button */}
                        <div className="mt-6 pt-6 border-t border-slate-200">
                          <Button variant="ghost" className="w-full flex items-center justify-center gap-2">
                            <span>View Class Details</span>
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Teaching Assistant - Takes up 1/3 */}
          <motion.div variants={fadeInUp}>
            <Card padding="none" className="overflow-hidden sticky top-6">
              <div className="p-6 bg-gradient-to-br from-brand-purple to-purple-600 text-white">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <Brain className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">AI Teaching Assistant</h3>
                    <p className="text-sm opacity-90">24/7 Support</p>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full bg-white text-brand-purple hover:bg-white/90"
                >
                  Ask a Question
                </Button>

                <div className="mt-6 pt-6 border-t border-white/20">
                  <p className="text-sm opacity-90 mb-4">
                    Need help with any of your classes? I can assist with:
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="opacity-70">•</span>
                      <span>Understanding concepts</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="opacity-70">•</span>
                      <span>Homework help</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="opacity-70">•</span>
                      <span>Test preparation</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="opacity-70">•</span>
                      <span>Study planning</span>
                    </li>
                  </ul>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </motion.div>

      {/* Enroll with Code Modal */}
      <EnrollWithCodeModal
        isOpen={showEnrollModal}
        onClose={() => setShowEnrollModal(false)}
      />
    </DashboardLayout>
  );
};
