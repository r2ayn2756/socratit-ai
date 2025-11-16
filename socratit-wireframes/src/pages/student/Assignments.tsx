// ============================================================================
// ASSIGNMENTS PAGE
// Shows all assignments from all enrolled classes with real-time status
// ============================================================================

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { DashboardLayout } from '../../components/layout';
import { Card, Button, Badge } from '../../components/common';
import {
  FileText,
  Clock,
  AlertCircle,
  Brain,
  BookOpen,
  TrendingUp,
  Play,
} from 'lucide-react';
import { assignmentService, Assignment } from '../../services/assignment.service';

export const Assignments: React.FC = () => {
  const navigate = useNavigate();

  // Fetch all assignments for the student
  const { data: assignmentsData, isLoading } = useQuery({
    queryKey: ['student-assignments'],
    queryFn: () => assignmentService.getAssignments({
      sortBy: 'dueDate',
      sortOrder: 'asc',
    }),
  });

  const assignments = assignmentsData?.data || [];

  // Categorize assignments by due date
  const now = new Date();
  const tonight = new Date(now);
  tonight.setHours(23, 59, 59, 999);

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(23, 59, 59, 999);

  const dueTonight = assignments.filter((a) => {
    if (!a.dueDate) return false;
    const dueDate = new Date(a.dueDate);
    return dueDate <= tonight && dueDate >= now;
  });

  const dueTomorrow = assignments.filter((a) => {
    if (!a.dueDate) return false;
    const dueDate = new Date(a.dueDate);
    return dueDate > tonight && dueDate <= tomorrow;
  });

  const upcoming = assignments.filter((a) => {
    if (!a.dueDate) return true; // No due date = upcoming
    const dueDate = new Date(a.dueDate);
    return dueDate > tomorrow;
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
      green: {
        gradient: 'from-green-500 to-green-600',
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-600',
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
    if (diffDays < 7) return `In ${diffDays} days`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDueTime = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getSubmissionStatus = (assignment: Assignment) => {
    const submission = assignment.studentSubmission;
    if (!submission) return { label: 'Not Started', variant: 'warning' as const, progress: 0 };

    if (submission.status === 'SUBMITTED' || submission.status === 'GRADED') {
      return { label: 'Completed', variant: 'success' as const, progress: 100 };
    }

    if (submission.status === 'IN_PROGRESS') {
      const progress = submission.percentage || 0;
      return { label: 'In Progress', variant: 'primary' as const, progress };
    }

    return { label: 'Not Started', variant: 'warning' as const, progress: 0 };
  };

  const renderAssignment = (assignment: Assignment) => {
    const colors = getColorClasses(assignment.class?.color || 'blue');
    const status = getSubmissionStatus(assignment);

    return (
      <motion.div
        key={assignment.id}
        variants={fadeInUp}
        whileHover={{ scale: 1.02, y: -2 }}
        className="cursor-pointer"
        onClick={() => navigate(`/student/assignments/${assignment.id}`)}
      >
        <Card variant="glass" padding="lg" hover className="overflow-hidden">
          <div>
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-bold text-slate-900">
                    {assignment.title}
                  </h3>
                  <Badge variant="neutral" size="sm">
                    {assignment.type}
                  </Badge>
                  <Badge variant={status.variant} size="sm">
                    {status.label}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-600">
                  <div className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    <span className={`font-medium ${colors.text}`}>
                      {assignment.class?.name || 'Unknown Class'}
                    </span>
                  </div>
                  <span>•</span>
                  <span>
                    {assignment.creator
                      ? `${assignment.creator.firstName} ${assignment.creator.lastName}`
                      : 'Unknown Teacher'}
                  </span>
                  <span>•</span>
                  <span className="font-medium">{assignment.totalPoints} points</span>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            {status.progress > 0 && status.progress < 100 && (
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs text-slate-600 mb-2">
                  <span>Progress</span>
                  <span className="font-semibold">{status.progress}%</span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${colors.gradient}`}
                    style={{ width: `${status.progress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Action Button */}
            <div className="flex items-center justify-between pt-4 border-t border-white/20">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Clock className="w-4 h-4" />
                <span>
                  Due {formatDueDate(assignment.dueDate)}
                  {assignment.dueDate && ` at ${formatDueTime(assignment.dueDate)}`}
                </span>
              </div>
              <Button
                variant={status.progress > 0 ? 'gradient' : 'glass'}
                size="sm"
                glow={status.progress > 0}
              >
                <Play className="w-4 h-4 mr-2" />
                {status.progress > 0 && status.progress < 100
                  ? 'Continue'
                  : status.progress === 100
                  ? 'Review'
                  : 'Start Assignment'}
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  };

  if (isLoading) {
    return (
      <DashboardLayout userRole="student">
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-600">Loading assignments...</div>
        </div>
      </DashboardLayout>
    );
  }

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
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Assignments</h1>
              <p className="text-slate-600">
                {dueTonight.length} due tonight, {dueTomorrow.length} due tomorrow
              </p>
            </div>
          </div>
        </motion.div>

        {/* Main Content and TA Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Assignments List - Takes up 2/3 */}
          <div className="lg:col-span-2 space-y-6">
            {/* Due Tonight Section */}
            {dueTonight.length > 0 && (
              <motion.div variants={fadeInUp}>
                <div className="flex items-center gap-3 mb-4">
                  <AlertCircle className="w-6 h-6 text-red-500" />
                  <h2 className="text-xl font-bold text-slate-900">Due Tonight</h2>
                  <Badge variant="error" size="sm">
                    {dueTonight.length}
                  </Badge>
                </div>
                <div className="space-y-4">
                  {dueTonight.map((assignment) => renderAssignment(assignment))}
                </div>
              </motion.div>
            )}

            {/* Due Tomorrow Section */}
            {dueTomorrow.length > 0 && (
              <motion.div variants={fadeInUp}>
                <div className="flex items-center gap-3 mb-4">
                  <Clock className="w-6 h-6 text-orange-500" />
                  <h2 className="text-xl font-bold text-slate-900">Due Tomorrow</h2>
                  <Badge variant="warning" size="sm">
                    {dueTomorrow.length}
                  </Badge>
                </div>
                <div className="space-y-4">
                  {dueTomorrow.map((assignment) => renderAssignment(assignment))}
                </div>
              </motion.div>
            )}

            {/* Upcoming Section */}
            {upcoming.length > 0 && (
              <motion.div variants={fadeInUp}>
                <div className="flex items-center gap-3 mb-4">
                  <FileText className="w-6 h-6 text-blue-500" />
                  <h2 className="text-xl font-bold text-slate-900">Upcoming</h2>
                  <Badge variant="neutral" size="sm">
                    {upcoming.length}
                  </Badge>
                </div>
                <div className="space-y-4">
                  {upcoming.map((assignment) => renderAssignment(assignment))}
                </div>
              </motion.div>
            )}

            {/* Empty State */}
            {assignments.length === 0 && (
              <Card variant="glassElevated" padding="xl">
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-blue-500/30">
                    <FileText className="w-10 h-10" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    No assignments yet
                  </h3>
                  <p className="text-slate-600">
                    Check back later for new assignments from your teachers
                  </p>
                </div>
              </Card>
            )}
          </div>

          {/* Teaching Assistant - Takes up 1/3 */}
          <motion.div variants={fadeInUp}>
            <Card variant="glassElevated" padding="none" className="overflow-hidden sticky top-6">
              <div className="p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <Brain className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">Teaching Assistant</h3>
                    <p className="text-sm opacity-90">24/7 Support</p>
                  </div>
                </div>
                <Button
                  variant="glass"
                  size="sm"
                  glow={false}
                  className="w-full bg-white text-purple-700 hover:bg-white/90"
                >
                  Ask a Question
                </Button>

                <div className="mt-6 pt-6 border-t border-white/20">
                  <p className="text-sm opacity-90 mb-4">
                    Stuck on an assignment? I can help with:
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="opacity-70">•</span>
                      <span>Breaking down problems</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="opacity-70">•</span>
                      <span>Understanding instructions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="opacity-70">•</span>
                      <span>Checking your work</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="opacity-70">•</span>
                      <span>Time management tips</span>
                    </li>
                  </ul>
                </div>

                {/* Quick Stats */}
                <div className="mt-6 pt-6 border-t border-white/20">
                  <div className="text-xs font-semibold opacity-90 uppercase tracking-wide mb-3">
                    Your Progress
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Assignments completed</span>
                      <span className="text-lg font-bold">
                        {
                          assignments.filter(
                            (a) =>
                              a.studentSubmission?.status === 'SUBMITTED' ||
                              a.studentSubmission?.status === 'GRADED'
                          ).length
                        }
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">In progress</span>
                      <span className="text-lg font-bold">
                        {
                          assignments.filter(
                            (a) => a.studentSubmission?.status === 'IN_PROGRESS'
                          ).length
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
};
