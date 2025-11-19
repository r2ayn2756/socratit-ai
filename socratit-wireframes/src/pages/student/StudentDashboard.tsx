// ============================================================================
// STUDENT DASHBOARD
// Main dashboard for students with assignments, grades, and upcoming deadlines
// ============================================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { DashboardLayout } from '../../components/layout';
import { Card, Button, Badge } from '../../components/common';
import { StatCard } from '../../components/common/StatCard';
import {
  FileText,
  Clock,
  TrendingUp,
  BookOpen,
  CheckCircle,
  AlertCircle,
  Target,
  Play,
} from 'lucide-react';
import { assignmentService } from '../../services/assignment.service';
import { useLanguage } from '../../contexts/LanguageContext';

export const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  // Fetch assignments from backend
  const { data: assignmentsData } = useQuery({
    queryKey: ['student-assignments'],
    queryFn: () =>
      assignmentService.getAssignments({
        sortBy: 'dueDate',
        sortOrder: 'asc',
      }),
  });

  const assignments = assignmentsData?.data || [];

  // Calculate stats from real data
  const now = new Date();
  const tonight = new Date(now);
  tonight.setHours(23, 59, 59, 999);

  const dueToday = assignments.filter((a) => {
    if (!a.dueDate) return false;
    const dueDate = new Date(a.dueDate);
    return dueDate <= tonight && dueDate >= now;
  });

  const inProgress = assignments.filter(
    (a) => a.studentSubmission?.status === 'IN_PROGRESS'
  );
  const completed = assignments.filter(
    (a) =>
      a.studentSubmission?.status === 'SUBMITTED' ||
      a.studentSubmission?.status === 'GRADED'
  );
  const notStarted = assignments.filter((a) => !a.studentSubmission);

  // Calculate average grade from completed assignments
  const gradedAssignments = assignments.filter(
    (a) => a.studentSubmission?.percentage !== null
  );
  const avgGrade = gradedAssignments.length
    ? Math.round(
        gradedAssignments.reduce(
          (sum, a) => sum + (a.studentSubmission?.percentage || 0),
          0
        ) / gradedAssignments.length
      )
    : 0;

  // Teaching Assistant removed - no longer needed

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
        text: 'text-blue-600',
      },
      purple: {
        gradient: 'from-purple-500 to-purple-600',
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        text: 'text-purple-600',
      },
      orange: {
        gradient: 'from-orange-500 to-orange-600',
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        text: 'text-orange-600',
      },
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const formatDueDate = (dateString?: string) => {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 0) return 'Overdue';

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  // Teaching Assistant handlers removed - no longer needed

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
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {t('student.dashboard.welcome')}
          </h1>
          <p className="text-slate-600">
            {dueToday.length === 0
              ? t('student.dashboard.noAssignmentsDue')
              : dueToday.length === 1
              ? t('student.dashboard.assignmentDue')
              : t('student.dashboard.assignmentsDue').replace('{count}', dueToday.length.toString())}
          </p>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Assignments */}
          <div className="lg:col-span-2 space-y-6">
            {/* Due Today */}
            {dueToday.length > 0 && (
              <motion.div variants={fadeInUp}>
                <div className="flex items-center gap-3 mb-4">
                  <AlertCircle className="w-6 h-6 text-red-500" />
                  <h2 className="text-xl font-bold text-slate-900">{t('student.dashboard.dueToday')}</h2>
                  <Badge variant="error" size="sm">
                    {dueToday.length}
                  </Badge>
                </div>
                <div className="space-y-4">
                  {dueToday.map((assignment) => {
                    const colors = getColorClasses(assignment.class?.color || 'blue');
                    const progress =
                      assignment.studentSubmission?.percentage || 0;

                    return (
                      <motion.div
                        key={assignment.id}
                        whileHover={{ scale: 1.01 }}
                        className="cursor-pointer"
                        onClick={() =>
                          navigate(`/student/assignments/${assignment.id}`)
                        }
                      >
                        <Card variant="glass" padding="lg" hover glow glowColor="red" className="overflow-hidden">
                          <div>
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h3 className="text-lg font-bold text-slate-900 mb-1">
                                  {assignment.title}
                                </h3>
                                <div className="flex items-center gap-3 text-sm text-slate-600">
                                  <div className="flex items-center gap-1">
                                    <BookOpen className="w-4 h-4" />
                                    <span className={`font-medium ${colors.text}`}>
                                      {assignment.class?.name}
                                    </span>
                                  </div>
                                  <span>•</span>
                                  <span>{assignment.totalPoints} points</span>
                                </div>
                              </div>
                              <Badge variant="neutral" size="sm">
                                {assignment.type}
                              </Badge>
                            </div>

                            {progress > 0 && progress < 100 && (
                              <div className="mb-3">
                                <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                                  <span>{t('student.dashboard.progress')}</span>
                                  <span className="font-semibold">{progress}%</span>
                                </div>
                                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full bg-gradient-to-r ${colors.gradient}`}
                                    style={{ width: `${progress}%` }}
                                  ></div>
                                </div>
                              </div>
                            )}

                            <Button variant="gradient" size="sm" className="w-full">
                              <Play className="w-4 h-4 mr-2" />
                              {progress > 0 ? t('common.buttons.continue') : t('common.buttons.startAssignment')}
                            </Button>
                          </div>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* In Progress */}
            {inProgress.length > 0 && (
              <motion.div variants={fadeInUp}>
                <div className="flex items-center gap-3 mb-4">
                  <Clock className="w-6 h-6 text-orange-500" />
                  <h2 className="text-xl font-bold text-slate-900">
                    {t('student.dashboard.inProgress')}
                  </h2>
                  <Badge variant="warning" size="sm">
                    {inProgress.length}
                  </Badge>
                </div>
                <div className="space-y-4">
                  {inProgress.slice(0, 3).map((assignment) => {
                    const colors = getColorClasses(assignment.class?.color || 'blue');
                    const progress =
                      assignment.studentSubmission?.percentage || 0;

                    return (
                      <Card
                        key={assignment.id}
                        variant="glass"
                        padding="md"
                        hover
                        className="cursor-pointer"
                        onClick={() =>
                          navigate(`/student/assignments/${assignment.id}`)
                        }
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-bold text-slate-900 mb-1">
                              {assignment.title}
                            </h4>
                            <p className={`text-sm ${colors.text}`}>
                              {assignment.class?.name} • {formatDueDate(assignment.dueDate)}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-slate-900">
                              {progress}%
                            </div>
                            <div className="text-xs text-slate-600">{t('student.dashboard.complete')}</div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Pending Assignments (Not Started) */}
            {notStarted.length > 0 && (
              <motion.div variants={fadeInUp}>
                <div className="flex items-center gap-3 mb-4">
                  <FileText className="w-6 h-6 text-blue-500" />
                  <h2 className="text-xl font-bold text-slate-900">
                    {t('student.dashboard.pendingAssignments')}
                  </h2>
                  <Badge variant="primary" size="sm">
                    {notStarted.length}
                  </Badge>
                </div>
                <div className="space-y-3">
                  {notStarted.slice(0, 5).map((assignment) => {
                    const colors = getColorClasses(assignment.class?.color || 'blue');
                    const isOverdue = assignment.dueDate && new Date(assignment.dueDate) < now;

                    return (
                      <Card
                        key={assignment.id}
                        variant="glass"
                        padding="md"
                        hover
                        className="cursor-pointer"
                        onClick={() =>
                          navigate(`/student/assignments/${assignment.id}`)
                        }
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-bold text-slate-900 mb-1">
                              {assignment.title}
                            </h4>
                            <div className="flex items-center gap-2">
                              <p className={`text-sm ${colors.text}`}>
                                {assignment.class?.name}
                              </p>
                              <span className="text-slate-400">•</span>
                              <p className={`text-sm ${isOverdue ? 'text-red-600 font-semibold' : 'text-slate-600'}`}>
                                {isOverdue ? 'OVERDUE' : formatDueDate(assignment.dueDate)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="glass" size="sm">
                              {assignment.totalPoints} pts
                            </Badge>
                            <Button variant="gradient" size="sm">
                              <Play className="w-4 h-4 mr-1" />
                              Start
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* All Completed Message */}
            {notStarted.length === 0 && inProgress.length === 0 && dueToday.length === 0 && assignments.length > 0 && (
              <motion.div variants={fadeInUp}>
                <Card variant="glassElevated" padding="xl" className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-green-500/30">
                    <CheckCircle className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">
                    {t('student.dashboard.allCaughtUp')}
                  </h3>
                  <p className="text-slate-600 mb-4">
                    {t('student.dashboard.allCaughtUpDesc')}
                  </p>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50/70 backdrop-blur-md border border-green-200/50 rounded-lg text-green-700 text-sm">
                    <TrendingUp className="w-4 h-4" />
                    <span className="font-semibold">{t('student.dashboard.keepUpWork')}</span>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* No Assignments Message */}
            {assignments.length === 0 && (
              <motion.div variants={fadeInUp}>
                <Card variant="glassElevated" padding="xl" className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-blue-500/30">
                    <FileText className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">
                    {t('student.dashboard.noAssignmentsYet')}
                  </h3>
                  <p className="text-slate-600">
                    {t('student.dashboard.checkBackLater')}
                  </p>
                </Card>
              </motion.div>
            )}

            {/* View All Assignments Link */}
            {assignments.length > 0 && (
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => navigate('/student/assignments')}
              >
                {t('student.dashboard.viewAllAssignments')}
              </Button>
            )}
          </div>

          {/* Right Column - Grades and Stats */}
          <motion.div variants={fadeInUp} className="space-y-6">
            {/* Teaching Assistant removed */}

            {/* Recent Grades */}
            {gradedAssignments.length > 0 && (
              <Card>
                <h3 className="font-bold text-slate-900 mb-4">{t('student.dashboard.recentGrades')}</h3>
                <div className="space-y-3">
                  {gradedAssignments.slice(0, 3).map((assignment) => (
                    <div
                      key={assignment.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-slate-900 text-sm">
                          {assignment.title}
                        </p>
                        <p className="text-xs text-slate-600">
                          {assignment.class?.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <div
                          className={`text-lg font-bold ${
                            (assignment.studentSubmission?.percentage || 0) >= 90
                              ? 'text-green-600'
                              : (assignment.studentSubmission?.percentage || 0) >= 80
                              ? 'text-blue-600'
                              : (assignment.studentSubmission?.percentage || 0) >= 70
                              ? 'text-orange-600'
                              : 'text-red-600'
                          }`}
                        >
                          {assignment.studentSubmission?.percentage || 0}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-3"
                  onClick={() => navigate('/student/grades')}
                >
                  {t('student.dashboard.viewAllGrades')}
                </Button>
              </Card>
            )}
          </motion.div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
};
