// ============================================================================
// STUDENT DASHBOARD
// Main dashboard for students with assignments, grades, and upcoming deadlines
// ============================================================================

import React from 'react';
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
  Brain,
  Target,
  HelpCircle,
  Lightbulb,
  Calculator,
  BookMarked,
  GraduationCap,
  Zap,
  Play,
} from 'lucide-react';
import { assignmentService } from '../../services/assignment.service';

export const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();

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

  // Teaching Assistant quick actions
  const taQuickActions = [
    {
      text: 'Help me prepare for my test',
      icon: <GraduationCap className="w-4 h-4" />,
      color: 'blue',
    },
    {
      text: "I don't know how to do my homework",
      icon: <HelpCircle className="w-4 h-4" />,
      color: 'purple',
    },
    {
      text: 'I forgot the quadratic formula',
      icon: <Calculator className="w-4 h-4" />,
      color: 'orange',
    },
    {
      text: 'Explain this concept simply',
      icon: <Lightbulb className="w-4 h-4" />,
      color: 'green',
    },
    {
      text: 'Walk me through this problem',
      icon: <BookMarked className="w-4 h-4" />,
      color: 'cyan',
    },
    {
      text: 'What should I study next?',
      icon: <Target className="w-4 h-4" />,
      color: 'pink',
    },
    {
      text: 'Quiz me on this topic',
      icon: <Zap className="w-4 h-4" />,
      color: 'purple',
    },
    {
      text: 'Teach me something new',
      icon: <Brain className="w-4 h-4" />,
      color: 'blue',
    },
  ];

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
            Welcome back! 👋
          </h1>
          <p className="text-slate-600">
            You have {dueToday.length} assignment{dueToday.length !== 1 ? 's' : ''}{' '}
            due today
          </p>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          variants={fadeInUp}
          className="grid grid-cols-1 md:grid-cols-4 gap-6"
        >
          <StatCard
            icon={FileText}
            label="Total Assignments"
            value={assignments.length}
            color="primary"
          />
          <StatCard
            icon={Clock}
            label="In Progress"
            value={inProgress.length}
            color="warning"
          />
          <StatCard
            icon={CheckCircle}
            label="Completed"
            value={completed.length}
            color="success"
          />
          <StatCard
            icon={TrendingUp}
            label="Average Grade"
            value={avgGrade ? `${avgGrade}%` : 'N/A'}
            color="secondary"
          />
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
                  <h2 className="text-xl font-bold text-slate-900">Due Today</h2>
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
                        <Card padding="none" className="overflow-hidden">
                          <div className="p-4 bg-white">
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
                                  <span>Progress</span>
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

                            <Button variant="primary" size="sm" className="w-full">
                              <Play className="w-4 h-4 mr-2" />
                              {progress > 0 ? 'Continue' : 'Start Assignment'}
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
                    In Progress
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
                        padding="sm"
                        className="cursor-pointer hover:shadow-md transition-shadow"
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
                            <div className="text-xs text-slate-600">complete</div>
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
                    Pending Assignments
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
                        padding="sm"
                        className="cursor-pointer hover:shadow-md transition-shadow"
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
                            <Badge variant="neutral" size="sm">
                              {assignment.totalPoints} pts
                            </Badge>
                            <Button variant="primary" size="sm">
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
                <Card className="text-center py-12">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-green-500/30">
                    <CheckCircle className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">
                    All Caught Up! 🎉
                  </h3>
                  <p className="text-slate-600 mb-4">
                    You've completed all your assignments. Great job!
                  </p>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                    <TrendingUp className="w-4 h-4" />
                    <span className="font-semibold">Keep up the excellent work!</span>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* No Assignments Message */}
            {assignments.length === 0 && (
              <motion.div variants={fadeInUp}>
                <Card className="text-center py-12">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-blue-500/30">
                    <FileText className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">
                    No Assignments Yet
                  </h3>
                  <p className="text-slate-600">
                    Check back later for new assignments from your teachers.
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
                View All Assignments
              </Button>
            )}
          </div>

          {/* Right Column - Teaching Assistant */}
          <motion.div variants={fadeInUp} className="space-y-6">
            {/* TA Card */}
            <Card padding="none" className="overflow-hidden">
              <div className="p-6 bg-gradient-to-br from-brand-purple to-purple-600 text-white">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <Brain className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">Teaching Assistant</h3>
                    <p className="text-sm opacity-90">24/7 Support</p>
                  </div>
                </div>

                <p className="text-sm opacity-90 mb-4">
                  Need help? I can assist with homework, studying, or understanding
                  concepts.
                </p>

                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full bg-white text-brand-purple hover:bg-white/90 mb-4"
                >
                  Start Conversation
                </Button>

                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide opacity-75">
                    Quick Actions
                  </p>
                  {taQuickActions.slice(0, 4).map((action, index) => (
                    <button
                      key={index}
                      className="w-full text-left px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm flex items-center gap-2"
                    >
                      {action.icon}
                      <span>{action.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            </Card>

            {/* Recent Grades */}
            {gradedAssignments.length > 0 && (
              <Card>
                <h3 className="font-bold text-slate-900 mb-4">Recent Grades</h3>
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
                  View All Grades
                </Button>
              </Card>
            )}
          </motion.div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
};
